package co.mtic.f27;

import android.app.Activity;
import android.Manifest;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.media.MediaScannerConnection;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.util.Base64;
import android.os.Handler;
import android.os.Looper;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.FileOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@CapacitorPlugin(name = "Cam", permissions = {
    @Permission(alias = "storage", strings = {Manifest.permission.WRITE_EXTERNAL_STORAGE}),
    @Permission(alias = "location", strings = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION})
})
public class CamPlugin extends Plugin {
    private File out;

    @PluginMethod
    public void getLocation(PluginCall call) {
        if (hasLocationPermission()) {
            locate(call);
            return;
        }
        requestPermissionForAlias("location", call, "locationPermissionResult");
    }

    @PermissionCallback
    private void locationPermissionResult(PluginCall call) {
        if (call == null) return;
        if (!hasLocationPermission()) {
            call.reject("Se requiere permiso de ubicación para obtener las coordenadas del sitio");
            return;
        }
        locate(call);
    }

    private boolean hasLocationPermission() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @SuppressWarnings("MissingPermission")
    private void locate(PluginCall call) {
        LocationManager manager = (LocationManager) getContext().getSystemService(Activity.LOCATION_SERVICE);
        if (manager == null) {
            call.reject("El servicio de ubicación no está disponible");
            return;
        }
        try {
            Location best = null;
            for (String provider : manager.getProviders(true)) {
                Location cached = manager.getLastKnownLocation(provider);
                if (cached != null && (best == null || cached.getTime() > best.getTime() ||
                    cached.getTime() == best.getTime() && cached.getAccuracy() < best.getAccuracy())) best = cached;
            }
            if (best != null && System.currentTimeMillis() - best.getTime() < 120000) {
                resolveLocation(call, best);
                return;
            }
            requestLocationUpdate(call, manager);
        } catch (SecurityException e) {
            call.reject("Android no concedió permiso para leer la ubicación", e);
        } catch (Exception e) {
            call.reject("No se pudo consultar la ubicación: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("MissingPermission")
    private void requestLocationUpdate(PluginCall call, LocationManager manager) {
        Handler handler = new Handler(Looper.getMainLooper());
        final boolean[] completed = {false};
        LocationListener listener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (completed[0]) return;
                completed[0] = true;
                handler.removeCallbacksAndMessages(null);
                try { manager.removeUpdates(this); } catch (SecurityException ignored) {}
                resolveLocation(call, location);
            }
        };
        Runnable timeout = () -> {
            if (completed[0]) return;
            completed[0] = true;
            try { manager.removeUpdates(listener); } catch (SecurityException ignored) {}
            call.reject("No se obtuvo una ubicación GPS. Activa la ubicación del teléfono e inténtalo de nuevo");
        };
        try {
            boolean requested = false;
            for (String provider : manager.getProviders(true)) {
                manager.requestLocationUpdates(provider, 0, 0, listener, Looper.getMainLooper());
                requested = true;
            }
            if (!requested) {
                call.reject("Activa la ubicación del teléfono e inténtalo de nuevo");
                return;
            }
            handler.postDelayed(timeout, 20000);
        } catch (SecurityException e) {
            completed[0] = true;
            call.reject("Android no concedió permiso para leer la ubicación", e);
        } catch (Exception e) {
            completed[0] = true;
            call.reject("No se pudo iniciar la búsqueda de ubicación: " + e.getMessage(), e);
        }
    }

    private void resolveLocation(PluginCall call, Location location) {
        JSObject result = new JSObject();
        result.put("latitude", location.getLatitude());
        result.put("longitude", location.getLongitude());
        result.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : 0);
        result.put("timestamp", location.getTime());
        call.resolve(result);
    }

    @PluginMethod
    public void list(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        List<ResolveInfo> l = pm.queryIntentActivities(i, 0);
        Map<String, JSObject> apps = new LinkedHashMap<>();
        for (ResolveInfo r : l) addCameraApp(apps, r, true);
        Intent launchers = new Intent(Intent.ACTION_MAIN);
        launchers.addCategory(Intent.CATEGORY_LAUNCHER);
        for (ResolveInfo r : pm.queryIntentActivities(launchers, 0)) {
            String label = r.loadLabel(pm).toString();
            if (label.toLowerCase(java.util.Locale.ROOT).contains("cam")) addCameraApp(apps, r, false);
        }
        JSArray arr = new JSArray();
        for (JSObject app : apps.values()) arr.put(app);
        JSObject res = new JSObject();
        res.put("apps", arr);
        call.resolve(res);
    }

    private void addCameraApp(Map<String, JSObject> apps, ResolveInfo info, boolean canCapture) {
        String pkg = info.activityInfo.packageName;
        JSObject app = apps.get(pkg);
        if (app == null) {
            app = new JSObject();
            app.put("pkg", pkg);
            app.put("label", info.loadLabel(getContext().getPackageManager()).toString());
            app.put("canCapture", canCapture);
            apps.put(pkg, app);
        } else if (canCapture) {
            app.put("canCapture", true);
        }
    }

    @PluginMethod
    public void open(PluginCall call) {
        String pkg = call.getString("pkg");
        Intent intent = pkg == null ? null : getContext().getPackageManager().getLaunchIntentForPackage(pkg);
        if (intent == null) {
            call.reject("La aplicación no permite abrirse desde MinTIC");
            return;
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void saveToGallery(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionResult");
            return;
        }
        saveImage(call);
    }

    @PermissionCallback
    private void storagePermissionResult(PluginCall call) {
        if (getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("Se requiere permiso de almacenamiento para guardar en DCIM/MinTIC Mantenimientos");
            return;
        }
        saveImage(call);
    }

    private void saveImage(PluginCall call) {
        Uri uri = null;
        try {
            String encoded = call.getString("data");
            if (encoded == null || encoded.isEmpty()) {
                call.reject("La foto está vacía");
                return;
            }
            byte[] data = Base64.decode(encoded, Base64.DEFAULT);
            String name = call.getString("name", "MinTIC_" + System.currentTimeMillis() + ".jpg");
            name = name.replaceAll("[^A-Za-z0-9._-]", "_");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_DCIM + "/MinTIC Mantenimientos");
                values.put(MediaStore.Images.Media.IS_PENDING, 1);
                uri = getContext().getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Android no creó el archivo de la foto");
                try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("No se pudo escribir la foto");
                    out.write(data);
                }
                ContentValues ready = new ContentValues();
                ready.put(MediaStore.Images.Media.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, ready, null, null);
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "MinTIC Mantenimientos");
                if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("No se pudo crear DCIM/MinTIC Mantenimientos");
                File file = new File(dir, name);
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(data); }
                MediaScannerConnection.scanFile(getContext(), new String[] {file.getAbsolutePath()}, new String[] {"image/jpeg"}, null);
                uri = Uri.fromFile(file);
            }
            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("path", "DCIM/MinTIC Mantenimientos/" + name);
            call.resolve(result);
        } catch (Exception e) {
            if (uri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getContext().getContentResolver().delete(uri, null, null);
            }
            call.reject("No se pudo guardar la foto en DCIM/MinTIC Mantenimientos: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void capture(PluginCall call) {
        try {
            out = new File(getContext().getCacheDir(), "cam_" + System.currentTimeMillis() + ".jpg");
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out);
            Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            i.putExtra(MediaStore.EXTRA_OUTPUT, uri);
            i.setClipData(ClipData.newRawUri("", uri));
            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            String pkg = call.getString("pkg");
            if (pkg != null && !pkg.isEmpty()) i.setPackage(pkg);
            startActivityForResult(call, i, "captureResult");
        } catch (Exception e) {
            call.reject("No se pudo abrir la camara: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void captureResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || out == null || !out.exists() || out.length() == 0) {
            JSObject r = new JSObject();
            r.put("canceled", true);
            call.resolve(r);
            return;
        }
        try {
            FileInputStream in = new FileInputStream(out);
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            in.close();
            out.delete();
            JSObject r = new JSObject();
            r.put("data", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
            call.resolve(r);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
