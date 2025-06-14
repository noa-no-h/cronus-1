#import <Cocoa/Cocoa.h>

#import <stdio.h>
#import <napi.h>
#import "./activeWindowObserver.h"
#import "./permissionManager.h"

void StartActiveWindowObserverMethod(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  initActiveWindowObserver(env, info[0].As<Napi::Function>());
}

void StopActiveWindowObserverMethod(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  stopActiveWindowObserver(env);
}

void SetShouldRequestPermissionsMethod(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsBoolean()) {
    Napi::TypeError::New(env, "Expected boolean argument").ThrowAsJavaScriptException();
    return;
  }
  
  bool shouldRequest = info[0].As<Napi::Boolean>().Value();
  [PermissionManager setShouldRequestPermissions:shouldRequest];
}

Napi::Value GetShouldRequestPermissionsMethod(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  BOOL shouldRequest = [PermissionManager shouldRequestPermissions];
  return Napi::Boolean::New(env, shouldRequest);
}

Napi::Object NativeWindows(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "startActiveWindowObserver"),
              Napi::Function::New(env, StartActiveWindowObserverMethod));
  exports.Set(Napi::String::New(env, "stopActiveWindowObserver"),
              Napi::Function::New(env, StopActiveWindowObserverMethod));
  exports.Set(Napi::String::New(env, "setShouldRequestPermissions"),
              Napi::Function::New(env, SetShouldRequestPermissionsMethod));
  exports.Set(Napi::String::New(env, "getShouldRequestPermissions"),
              Napi::Function::New(env, GetShouldRequestPermissionsMethod));
  return exports;
}

NODE_API_MODULE(nativeWindows, NativeWindows)