package co.mtic.f27;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CamPlugin.class);
        registerPlugin(ScanPlugin.class);
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (MainActivity.this.getBridge() == null || MainActivity.this.getBridge().getWebView() == null) {
                    MainActivity.this.finish();
                    return;
                }
                MainActivity.this.getBridge().getWebView().evaluateJavascript(
                    "(function(){return window.handleHardwareBack?window.handleHardwareBack():false})()",
                    handled -> {
                        if ("false".equals(handled)) runOnUiThread(MainActivity.this::finish);
                    }
                );
            }
        });
    }
}
