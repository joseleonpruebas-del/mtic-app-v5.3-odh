package co.mtic.f27;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanIntentResult;
import com.journeyapps.barcodescanner.ScanOptions;

@CapacitorPlugin(name = "Scan")
public class ScanPlugin extends Plugin {

    @PluginMethod
    public void scan(PluginCall call) {
        ScanOptions options = new ScanOptions();
        options.setPrompt(call.getString("prompt", "Enfoca el codigo de barras o QR"));
        options.setBeepEnabled(true);
        options.setOrientationLocked(false);
        options.setCaptureActivity(CaptureActivityPortrait.class);
        Intent intent = new ScanContract().createIntent(getContext(), options);
        startActivityForResult(call, intent, "scanResult");
    }

    @ActivityCallback
    private void scanResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        ScanIntentResult r = ScanIntentResult.parseActivityResult(result.getResultCode(), result.getData());
        JSObject o = new JSObject();
        if (r.getContents() == null) {
            o.put("canceled", true);
        } else {
            o.put("text", r.getContents());
            o.put("format", r.getFormatName());
        }
        call.resolve(o);
    }
}
