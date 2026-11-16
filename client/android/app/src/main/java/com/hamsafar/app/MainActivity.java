package com.hamsafar.app;

import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState); // Capacitor creates the WebView here

        // DEBUG BUILDS ONLY: the app page is https://localhost but the API on your PC is http://10.0.2.2:5080.
        // Browsers block http calls from an https page ("mixed content") unless we allow it.
        // A release build is not "debuggable", so this never runs in the Play Store version.
        boolean debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        if (debuggable && getBridge() != null) {
            getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}
