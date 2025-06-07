#pragma once
#include <stdio.h>
#include <string>
#include <Cocoa/Cocoa.h>
#include <napi.h>

void initActiveWindowObserver(Napi::Env env, Napi::Function windowCallback);
void stopActiveWindowObserver(Napi::Env env);

@interface ActiveWindowObserver: NSObject
- (id) init;
// sort of like exporting the class to the main thread
- (void) dealloc;
- (void) cleanUp;
- (void) removeWindowObserver;
- (void) receiveAppChangeNotification:(NSNotification *) notification;
- (void) sendWindowInfoToJS:(NSDictionary*)windowInfo withReason:(NSString*)reason;

// Internal helper methods for window content extraction
- (NSDictionary*)getActiveWindow;
- (NSString*)getAppTextContent:(NSString*)ownerName windowId:(CGWindowID)windowId;
- (NSString*)getGenericAccessibilityText:(CGWindowID)windowId;
- (NSString*)getCodeEditorText:(CGWindowID)windowId;
- (NSString*)getTerminalText:(CGWindowID)windowId;
- (NSString*)getMessagingAppText:(CGWindowID)windowId;
- (NSString*)getTextEditorContent:(CGWindowID)windowId;
- (NSString*)getCodeEditorAccessibilityText:(CGWindowID)windowId;
@end