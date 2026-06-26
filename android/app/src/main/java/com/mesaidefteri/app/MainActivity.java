package com.mesaidefteri.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15 (API 35) ile edge-to-edge default. WebView'i sistem barlarının
        // altına itmemek için decor'u system insets'lere göre boyutlandır.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(true);
        }
        // Eski Android'lerde de SYSTEM_UI_FLAG_LAYOUT_STABLE kapalı kalsın ki
        // alt navigasyon (Android gesture/nav bar) WebView içeriğini ezmesin.
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(decor.getSystemUiVisibility()
                & ~View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                & ~View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                & ~View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
}
