#pragma once
#include <stdio.h>
#include <string>
#include <Cocoa/Cocoa.h>
#include <napi.h>
#import "chromeTabTracking.h"

void initActiveWindowObserver(Napi::Env env, Napi::Function windowCallback);
void stopActiveWindowObserver(Napi::Env env);

@interface ActiveWindowObserver: NSObject <ChromeTabTrackingDelegate>
- (id) init;
// sort of like exporting the class to the main thread
- (void) dealloc;
- (void) cleanUp;
- (void) removeWindowObserver;
- (void) receiveAppChangeNotification:(NSNotification *) notification;
- (void) sendWindowInfoToJS:(NSDictionary*)windowInfo withReason:(NSString*)reason;

// Internal helper methods for window content extraction
- (NSDictionary*)getActiveWindow;
@end