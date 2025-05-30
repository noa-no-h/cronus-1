#pragma once
#include <stdio.h>
#include <string>
#include <Cocoa/Cocoa.h>
#include <napi.h>

void initActiveWindowObserver(Napi::Env env, Napi::Function windowCallback);
void stopActiveWindowObserver(Napi::Env env);

@interface ActiveWindowObserver: NSObject
- (id) init;
- (void) dealloc;
- (void) cleanUp;
- (void) removeWindowObserver;
- (void) receiveAppChangeNotification:(NSNotification *) notification;
- (NSDictionary*)getActiveWindow;
- (NSString*)getAppTextContent:(NSString*)ownerName windowId:(CGWindowID)windowId;
- (NSString*)getGenericAccessibilityText:(CGWindowID)windowId;
- (NSString*)getCodeEditorText:(CGWindowID)windowId;
- (NSString*)getTerminalText:(CGWindowID)windowId;
- (NSString*)getMessagingAppText:(CGWindowID)windowId;
- (NSString*)getTextEditorContent:(CGWindowID)windowId;
- (NSString*)getCodeEditorAccessibilityText:(CGWindowID)windowId;
@end