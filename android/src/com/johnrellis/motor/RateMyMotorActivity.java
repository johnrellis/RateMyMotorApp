package com.johnrellis.motor;

import org.apache.cordova.DroidGap;

import android.app.Activity;
import android.os.Bundle;
import org.apache.cordova.*;

public class RateMyMotorActivity extends DroidGap {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //http://stackoverflow.com/questions/5865697/how-add-an-application-pre-loader-startup-screen-splash-screen-to-my-phonegap-an
        super.setIntegerProperty("splashscreen", R.drawable.splash); // Displays the splash screen for android
        super.loadUrl("file:///android_asset/www/index.html",3000); // Second parameter is duration for delay of splash screen
    }
}