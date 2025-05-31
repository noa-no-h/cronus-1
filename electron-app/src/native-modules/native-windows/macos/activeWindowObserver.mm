#import "activeWindowObserver.h"
#include <iostream>
#import <CoreGraphics/CoreGraphics.h>

Napi::ThreadSafeFunction activeWindowChangedCallback;
ActiveWindowObserver *windowObserver;

auto napiCallback = [](Napi::Env env, Napi::Function jsCallback, std::string* data) {
    jsCallback.Call({Napi::String::New(env, *data)});
    delete data;
};

void windowChangeCallback(AXObserverRef observer, AXUIElementRef element, CFStringRef notificationName, void *refCon) {
    if (CFStringCompare(notificationName, kAXMainWindowChangedNotification, 0) == kCFCompareEqualTo) {
        NSTimeInterval delayInMSec = 30;
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInMSec * NSEC_PER_MSEC));
        dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
            NSLog(@"mainWindowChanged");
            NSDictionary *details = [(__bridge ActiveWindowObserver*)(refCon) getActiveWindow];
            if (details) {
                NSError *error;
                NSData *jsonData = [NSJSONSerialization dataWithJSONObject:details options:0 error:&error];
                if (!jsonData) {
                    NSLog(@"Error creating JSON data in windowChangeCallback: %@", error);
                } else {
                    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                    std::string* result = new std::string([jsonString UTF8String]);
                    activeWindowChangedCallback.BlockingCall(result, napiCallback);
                }
            }
        });
    }
}

@implementation ActiveWindowObserver {
    NSNumber *processId;
    AXObserverRef observer;
    NSTimer *screenshotTimer;
    NSData *lastScreenshotData;
    NSTimer *periodicCheckTimer;          
    NSString *lastTrackedApp;             
    NSTimeInterval lastAppSwitchTime;    
    BOOL isCurrentlyTracking;           
}

- (void) dealloc
{
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [super dealloc];
}

- (id)init {
    self = [super init];
    if (!self) return nil;
    
    // App switch notifications (keep this - it's perfect!)
    [[[NSWorkspace sharedWorkspace] notificationCenter] addObserver:self 
                                                         selector:@selector(receiveAppChangeNotification:) 
                                                             name:NSWorkspaceDidActivateApplicationNotification 
                                                           object:nil];
    
    // Start periodic backup timer 
    [self startPeriodicBackupTimer];

    // comment out for only text based content handling 
    // [self startScreenshotTimer]; 
    
    return self;
}

// periodic backup timer
- (void)startPeriodicBackupTimer {
    [self stopPeriodicBackupTimer];
    
    // Check every 2-3 minutes as backup 
    periodicCheckTimer = [NSTimer scheduledTimerWithTimeInterval:150.0  
                                                        target:self
                                                      selector:@selector(periodicBackupCheck)
                                                      userInfo:nil
                                                       repeats:YES];
    [[NSRunLoop currentRunLoop] addTimer:periodicCheckTimer forMode:NSRunLoopCommonModes];
    NSLog(@"📅 Periodic backup timer started (2.5 min intervals)");
}

- (void)stopPeriodicBackupTimer {
    [periodicCheckTimer invalidate];
    periodicCheckTimer = nil;
    NSLog(@"📅 Periodic backup timer stopped");
}

// Backup check (only if user hasn't switched apps recently)
- (void)periodicBackupCheck {
    NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
    NSTimeInterval timeSinceLastSwitch = now - lastAppSwitchTime;
    
    // Only do backup capture if user has been on same app for a while
    if (timeSinceLastSwitch > 120.0) {  // 2+ minutes on same app
        NSLog(@"📅 PERIODIC BACKUP: User on same app for %.1f minutes", timeSinceLastSwitch / 60.0);
        
        NSDictionary *windowInfo = [self getActiveWindow];
        if (windowInfo) {
            NSString *currentApp = windowInfo[@"ownerName"];
            
            // Only send if it's a significant change or long time passed
            if (![currentApp isEqualToString:lastTrackedApp] || timeSinceLastSwitch > 600.0) {
                NSLog(@"📅 BACKUP CAPTURE: %@", currentApp);
                [self sendWindowInfoToJS:windowInfo withReason:@"periodic_backup"];
                lastTrackedApp = currentApp;
            }
        }
    }
}

- (void) receiveAppChangeNotification:(NSNotification *) notification {
    [self removeWindowObserver];

    int currentAppPid = [NSProcessInfo processInfo].processIdentifier;
    NSDictionary<NSString*, NSRunningApplication*> *userInfo = [notification userInfo];
    NSNumber *selectedProcessId = [userInfo valueForKeyPath:@"NSWorkspaceApplicationKey.processIdentifier"];

    if (processId != nil && selectedProcessId.intValue == currentAppPid) {
        return;
    }

    processId = selectedProcessId;
    
    // 🎯 NEW: Track app switch timing
    lastAppSwitchTime = [[NSDate date] timeIntervalSince1970];

    NSDictionary *details = [self getActiveWindow];
    if (details) {
        NSLog(@"🚀 INSTANT APP SWITCH: %@", details[@"ownerName"]);
        lastTrackedApp = details[@"ownerName"];
        [self sendWindowInfoToJS:details withReason:@"app_switch"];
    }

    AXUIElementRef appElem = AXUIElementCreateApplication(processId.intValue);
    AXError createResult = AXObserverCreate(processId.intValue, windowChangeCallback, &observer);

    if (createResult != kAXErrorSuccess) {
        NSLog(@"Copy or create result failed");
        return;
    }

    AXObserverAddNotification(observer, appElem, kAXMainWindowChangedNotification, (__bridge void *)(self));
    CFRunLoopAddSource([[NSRunLoop currentRunLoop] getCFRunLoop], AXObserverGetRunLoopSource(observer), kCFRunLoopDefaultMode);
    NSLog(@"Observers added");
}

// Centralized method to send data to JavaScript
- (void)sendWindowInfoToJS:(NSDictionary*)windowInfo withReason:(NSString*)reason {
    NSMutableDictionary *enrichedInfo = [windowInfo mutableCopy];
    enrichedInfo[@"captureReason"] = reason;  // "app_switch" or "periodic_backup"
    enrichedInfo[@"timestamp"] = @([[NSDate date] timeIntervalSince1970] * 1000);
    
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:enrichedInfo options:0 error:&error];
    if (!jsonData) {
        NSLog(@"Error creating JSON data: %@", error);
        return;
    }
    
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    std::string* result = new std::string([jsonString UTF8String]);
    activeWindowChangedCallback.BlockingCall(result, napiCallback);
    
    NSLog(@"📤 SENT TO JS: %@ (%@)", enrichedInfo[@"ownerName"], reason);
}

- (NSDictionary*)getActiveWindow {
    NSArray *windows = (__bridge NSArray *)CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID);
    NSDictionary *frontmostWindow = nil;

    for (NSDictionary *window in windows) {
        NSNumber *windowLayer = [window objectForKey:(id)kCGWindowLayer];
        if ([windowLayer intValue] == 0) { 
            frontmostWindow = window;
            break;
        }
    }

    if (frontmostWindow) {
        NSNumber *windowNumber = [frontmostWindow objectForKey:(id)kCGWindowNumber];
        NSString *windowOwnerName = [frontmostWindow objectForKey:(id)kCGWindowOwnerName];
        NSString *windowTitle = [frontmostWindow objectForKey:(id)kCGWindowName];
        CGWindowID windowId = [windowNumber unsignedIntValue];

        // filter out specific apps 
        if ([self shouldExcludeApp:windowOwnerName withTitle:windowTitle]) {
            return nil;
        }
        
        // Create base window info
        NSMutableDictionary *windowInfo = [@{
            @"id": windowNumber,
            @"ownerName": windowOwnerName ? windowOwnerName : @"Unknown",
            @"title": windowTitle ? windowTitle : @"",
            @"type": @"window",
            @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
        } mutableCopy];

        NSLog(@"🔍 ACTIVE WINDOW CHANGED:");
        NSLog(@"   Owner: %@", windowOwnerName);
        NSLog(@"   Title: %@", windowTitle);
        NSLog(@"   Type: %@", windowInfo[@"type"]);
        
        // Check for browser windows
        if ([windowOwnerName isEqualToString:@"Google Chrome"]) {
            NSDictionary *chromeInfo = [self getChromeTabInfo];
            if (chromeInfo) {
                [windowInfo addEntriesFromDictionary:chromeInfo];
                windowInfo[@"type"] = @"browser";
                windowInfo[@"browser"] = @"chrome";
            }
        } else if ([windowOwnerName isEqualToString:@"Safari"]) {
            NSDictionary *safariInfo = [self getSafariTabInfo];
            if (safariInfo) {
                [windowInfo addEntriesFromDictionary:safariInfo];
                windowInfo[@"type"] = @"browser";
                windowInfo[@"browser"] = @"safari";
            }
        } else {
            NSLog(@"   ⚠️  NON-BROWSER APP - Only title available: '%@'", windowTitle);
            NSString *extractedText = [self getAppTextContent:windowOwnerName windowId:windowId];
        if (extractedText && extractedText.length > 0) {
            windowInfo[@"content"] = extractedText;
            NSLog(@"   ✅ Extracted %lu characters from %@", (unsigned long)[extractedText length], windowOwnerName);
            NSLog(@"   Content preview: %@", [extractedText length] > 200 ? [extractedText substringToIndex:200] : extractedText);
        } else {
            NSLog(@"   ⚠️  No text content extracted from %@", windowOwnerName);
        }
        }
        
        return windowInfo;
    }
    return nil;
}

- (NSString*)getWindowTitle:(CGWindowID)windowId {
    CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionIncludingWindow, windowId);
    if (windowList) {
        NSArray *windows = (__bridge_transfer NSArray*)windowList;
        for (NSDictionary *window in windows) {
            NSString *title = window[(__bridge NSString*)kCGWindowName];
            if (title && title.length > 0) {
                return title;
            }
        }
    }
    return @"";
}

- (NSDictionary*)getChromeTabInfo {
    NSLog(@"Starting Chrome tab info gathering...");
    
    // First check if Chrome is running
    NSRunningApplication *chromeApp = [[NSRunningApplication runningApplicationsWithBundleIdentifier:@"com.google.Chrome"] firstObject];
    if (!chromeApp) {
        NSLog(@"Chrome is not running");
        return nil;
    }
    
    // Check if Chrome is frontmost
    if (![chromeApp isActive]) {
        NSLog(@"Chrome is not the active application");
        return nil;
    }
    
    // First try to get just the URL and title without JavaScript
    NSString *basicScript = @"tell application \"Google Chrome\"\n"
                           "  try\n"
                           "    set activeTab to active tab of front window\n"
                           "    set tabUrl to URL of activeTab\n"
                           "    set tabTitle to title of activeTab\n"
                           "    return tabUrl & \"|\" & tabTitle\n"
                           "  on error errMsg\n"
                           "    return \"ERROR|\" & errMsg\n"
                           "  end try\n"
                           "end tell";
    
    NSAppleScript *basicAppleScript = [[NSAppleScript alloc] initWithSource:basicScript];
    NSDictionary *error = nil;
    NSAppleEventDescriptor *basicResult = [basicAppleScript executeAndReturnError:&error];
    
    if (error) {
        NSLog(@"Basic AppleScript error: %@", error);
        return nil;
    }
    
    NSString *basicInfo = [basicResult stringValue];
    if (!basicInfo || [basicInfo hasPrefix:@"ERROR|"]) {
        NSLog(@"Basic script error: %@", basicInfo);
        return nil;
    }
    
    NSArray *basicComponents = [basicInfo componentsSeparatedByString:@"|"];
    if (basicComponents.count < 2) {
        NSLog(@"Invalid basic info components");
        return nil;
    }
    
    // Create base info with URL and title
    NSMutableDictionary *tabInfo = [@{
        @"url": basicComponents[0],
        @"title": basicComponents[1],
        @"type": @"chrome",
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    } mutableCopy];
    
    // Try to get content with JavaScript if possible
    NSString *jsScript = @"tell application \"Google Chrome\"\n"
                        "  try\n"
                        "    set activeTab to active tab of front window\n"
                        "    set tabContent to execute activeTab javascript \"document.body.innerText\"\n"
                        "    return tabContent\n"
                        "  on error errMsg\n"
                        "    if errMsg contains \"JavaScript\" then\n"
                        "      return \"JS_DISABLED\"\n"
                        "    end if\n"
                        "    return \"ERROR|\" & errMsg\n"
                        "  end try\n"
                        "end tell";
    
    NSAppleScript *jsAppleScript = [[NSAppleScript alloc] initWithSource:jsScript];
    NSAppleEventDescriptor *jsResult = [jsAppleScript executeAndReturnError:&error];
    
    if (!error && jsResult) {
        NSString *jsInfo = [jsResult stringValue];
        if (jsInfo && ![jsInfo hasPrefix:@"ERROR|"]) {
            if ([jsInfo isEqualToString:@"JS_DISABLED"]) {
                NSLog(@"JavaScript is disabled in Chrome. Please enable it in View > Developer > Allow JavaScript from Apple Events");
            } else {
                tabInfo[@"content"] = jsInfo;
                NSLog(@"🎯 CHROME CONTENT CAPTURED:");
                NSLog(@"   App: %@", tabInfo[@"url"]);
                NSLog(@"   Title: %@", tabInfo[@"title"]);
                NSLog(@"   Content Length: %lu characters", (unsigned long)[jsInfo length]);
                NSLog(@"   Content Preview (first 200 chars): %@", [jsInfo length] > 200 ? [jsInfo substringToIndex:200] : jsInfo);
            }
        }
    }
    
    return tabInfo;
}

- (NSDictionary*)getSafariTabInfo {
    NSMutableDictionary *tabInfo = [NSMutableDictionary dictionary];
    
    // First try to get just the URL and title
    NSString *basicScript = @"tell application \"Safari\"\n"
                            "  try\n"
                            "    set currentTab to current tab of front window\n"
                            "    set tabUrl to URL of currentTab\n"
                            "    set tabTitle to name of currentTab\n"
                            "    return tabUrl & \"|\" & tabTitle\n"
                            "  on error errMsg\n"
                            "    return \"ERROR|\" & errMsg\n"
                            "  end try\n"
                            "end tell";
    
    NSAppleScript *basicAppleScript = [[NSAppleScript alloc] initWithSource:basicScript];
    NSDictionary *error = nil;
    NSAppleEventDescriptor *basicResult = [basicAppleScript executeAndReturnError:&error];
    
    if (!error && basicResult) {
        NSString *basicInfo = [basicResult stringValue];
        if (basicInfo && ![basicInfo hasPrefix:@"ERROR|"]) {
            NSArray *components = [basicInfo componentsSeparatedByString:@"|"];
            if (components.count >= 2) {
                tabInfo[@"url"] = components[0];
                tabInfo[@"title"] = components[1];
                
                // Now try to get the content
                NSString *contentScript = @"tell application \"Safari\"\n"
                                        "  try\n"
                                        "    set currentTab to current tab of front window\n"
                                        "    set tabContent to do JavaScript \"document.body.innerText\" in currentTab\n"
                                        "    return tabContent\n"
                                        "  on error errMsg\n"
                                        "    if errMsg contains \"JavaScript\" then\n"
                                        "      return \"JS_DISABLED\"\n"
                                        "    end if\n"
                                        "    return \"ERROR|\" & errMsg\n"
                                        "  end try\n"
                                        "end tell";
                
                NSAppleScript *contentAppleScript = [[NSAppleScript alloc] initWithSource:contentScript];
                NSAppleEventDescriptor *contentResult = [contentAppleScript executeAndReturnError:&error];
                
                if (!error && contentResult) {
                    NSString *content = [contentResult stringValue];
                    if (content && ![content hasPrefix:@"ERROR|"]) {
                        if ([content isEqualToString:@"JS_DISABLED"]) {
                            NSLog(@"JavaScript is disabled in Safari. Please enable it in Safari > Settings > Advanced > Allow JavaScript from Apple Events");
                        } else {
                            tabInfo[@"content"] = content;
                            NSLog(@"Successfully got Safari content, length: %lu", (unsigned long)[content length]);
                            NSLog(@"🎯 SAFARI CONTENT CAPTURED:");
                            NSLog(@"   URL: %@", tabInfo[@"url"]);
                            NSLog(@"   Title: %@", tabInfo[@"title"]);
                            NSLog(@"   Content Length: %lu characters", (unsigned long)[content length]);
                            NSLog(@"   Content Preview (first 200 chars): %@", [content length] > 200 ? [content substringToIndex:200] : content);
                        }
                    }
                }
                
                tabInfo[@"browser"] = @"safari";
                return tabInfo;
            }
        }
    }
    
    if (error) {
        NSLog(@"Safari AppleScript error: %@", error);
    }
    
    return nil;
}

// screenshot related

- (NSData*)captureWindowScreenshot:(CGWindowID)windowId {
    // Get window bounds
    CGRect windowBounds;
    CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionIncludingWindow, windowId);
    if (windowList) {
        NSArray *windows = (__bridge_transfer NSArray*)windowList;
        for (NSDictionary *window in windows) {
            CGRect bounds;
            CGRectMakeWithDictionaryRepresentation((__bridge CFDictionaryRef)window[(__bridge NSString*)kCGWindowBounds], &bounds);
            windowBounds = bounds;

            NSLog(@"Window bounds (scaled): %@", NSStringFromRect(NSRectFromCGRect(bounds)));

            break;
        }
    }

    // Create an image of the window
    CGImageRef windowImage = CGWindowListCreateImage(
        windowBounds,
        kCGWindowListOptionIncludingWindow,
        windowId,
        kCGWindowImageBoundsIgnoreFraming | kCGWindowImageNominalResolution
    );
    
    if (!windowImage) {
        NSLog(@"Failed to create window image");
        return nil;
    }
    
      // Convert to JPEG with increased compression
    NSMutableData *imageData = [NSMutableData data];
    CGImageDestinationRef destination = CGImageDestinationCreateWithData(
        (__bridge CFMutableDataRef)imageData,
        kUTTypeJPEG,
        1,
        NULL
    );
    
    if (!destination) {
        CGImageRelease(windowImage);
        return nil;
    }
    
    // Set compression quality 
    NSDictionary *properties = @{
        (__bridge NSString *)kCGImageDestinationLossyCompressionQuality: @0.5
    };
    
    CGImageDestinationAddImage(destination, windowImage, (__bridge CFDictionaryRef)properties);
    CGImageDestinationFinalize(destination);
    
    // Clean up
    CFRelease(destination);
    CGImageRelease(windowImage);
    
    return imageData;
}

- (void)startScreenshotTimer {
    [self stopScreenshotTimer];
    
    // Take screenshot every 30 seconds
    screenshotTimer = [NSTimer scheduledTimerWithTimeInterval:10.0
                                                     target:self
                                                   selector:@selector(takeScreenshot)
                                                   userInfo:nil
                                                    repeats:YES];
    [[NSRunLoop currentRunLoop] addTimer:screenshotTimer forMode:NSRunLoopCommonModes];
    NSLog(@"Screenshot timer started");
}

- (void)stopScreenshotTimer {
    [screenshotTimer invalidate];
    screenshotTimer = nil;
    NSLog(@"Screenshot timer stopped");
}

- (void)takeScreenshot {
    NSDictionary *windowInfo = [self getActiveWindow];
    if (!windowInfo) return;
    
    CGWindowID windowId = [[windowInfo objectForKey:@"id"] unsignedIntValue];
    NSData *screenshotData = [self captureWindowScreenshot:windowId];
    
    if (!screenshotData) {
        NSLog(@"Failed to capture screenshot");
        return;
    }
    
    // Save screenshot to a temporary file
    NSString *tempDir = NSTemporaryDirectory();
    NSString *fileName = [NSString stringWithFormat:@"%@.jpg", [[NSUUID UUID] UUIDString]];
    NSString *filePath = [tempDir stringByAppendingPathComponent:fileName];
    BOOL success = [screenshotData writeToFile:filePath atomically:YES];

    if (!success) {
        NSLog(@"Failed to save screenshot to temp file: %@", filePath);
        return;
    }

    // Add screenshot path to window info
    NSMutableDictionary *updatedInfo = [windowInfo mutableCopy];
    updatedInfo[@"localScreenshotPath"] = filePath; // Send path instead of base64
    updatedInfo[@"screenshotTimestamp"] = @([[NSDate date] timeIntervalSince1970] * 1000);
    
    // Send to JavaScript
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:updatedInfo options:0 error:&error];
    if (!jsonData) {
        NSLog(@"Error creating JSON data: %@", error);
        return;
    }
    
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    std::string* result = new std::string([jsonString UTF8String]);
    activeWindowChangedCallback.BlockingCall(result, napiCallback);
    NSLog(@"Screenshot captured, saved to %@, and event sent", filePath);
}

- (void) removeWindowObserver
{
    if (observer != Nil) {
        CFRunLoopRemoveSource([[NSRunLoop currentRunLoop] getCFRunLoop], AXObserverGetRunLoopSource(observer), kCFRunLoopDefaultMode);
        CFRelease(observer);
        observer = Nil;
    }
}

- (void)cleanUp {
    [self stopScreenshotTimer];        
    [self stopPeriodicBackupTimer];    
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [self removeWindowObserver];
}

- (NSString*)getAppTextContent:(NSString*)ownerName windowId:(CGWindowID)windowId {
    NSLog(@"🔍 Attempting to extract text from: %@", ownerName);
    
    // Different strategies for different app types
    if ([ownerName containsString:@"Code"] || [ownerName containsString:@"Cursor"] || [ownerName containsString:@"Xcode"]) {
        return [self getCodeEditorText:windowId];
    } else if ([ownerName containsString:@"Terminal"] || [ownerName containsString:@"iTerm"]) {
        return [self getTerminalText:windowId];
    } else if ([ownerName containsString:@"Mail"] || [ownerName containsString:@"Slack"] || [ownerName containsString:@"Discord"]) {
        return [self getMessagingAppText:windowId];
    } else if ([ownerName containsString:@"TextEdit"] || [ownerName containsString:@"Notes"]) {
        return [self getTextEditorContent:windowId];
    }
    
    // Generic accessibility text extraction
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getGenericAccessibilityText:(CGWindowID)windowId {
    @try {
        // Get the accessibility element for the window
        AXUIElementRef systemElement = AXUIElementCreateSystemWide();
        CFArrayRef windowList;
        AXUIElementCopyAttributeValues(systemElement, kAXWindowsAttribute, 0, 100, &windowList);
        
        if (windowList) {
            NSArray *windows = (__bridge NSArray *)windowList;
            
            for (id windowElement in windows) {
                AXUIElementRef window = (__bridge AXUIElementRef)windowElement;
                
                // Try to get text content from the window
                CFStringRef textContent;
                AXError result = AXUIElementCopyAttributeValue(window, kAXValueAttribute, (CFTypeRef*)&textContent);
                
                if (result == kAXErrorSuccess && textContent) {
                    NSString *text = (__bridge NSString *)textContent;
                    CFRelease(textContent);
                    CFRelease(windowList);
                    CFRelease(systemElement);
                    
                    NSLog(@"✅ Generic accessibility text extracted: %lu chars", (unsigned long)[text length]);
                    return text;
                }
                
                // Try alternative: get focused element's text
                AXUIElementRef focusedElement;
                result = AXUIElementCopyAttributeValue(window, kAXFocusedUIElementAttribute, (CFTypeRef*)&focusedElement);
                
                if (result == kAXErrorSuccess && focusedElement) {
                    result = AXUIElementCopyAttributeValue(focusedElement, kAXValueAttribute, (CFTypeRef*)&textContent);
                    
                    if (result == kAXErrorSuccess && textContent) {
                        NSString *text = (__bridge NSString *)textContent;
                        CFRelease(textContent);
                        CFRelease(focusedElement);
                        CFRelease(windowList);
                        CFRelease(systemElement);
                        
                        NSLog(@"✅ Focused element text extracted: %lu chars", (unsigned long)[text length]);
                        return text;
                    }
                    CFRelease(focusedElement);
                }
            }
            CFRelease(windowList);
        }
        CFRelease(systemElement);
    } @catch (NSException *exception) {
        NSLog(@"❌ Error extracting accessibility text: %@", exception.reason);
    }
    
    return nil;
}

// Add the missing method implementations:
- (NSString*)getCodeEditorText:(CGWindowID)windowId {
    NSLog(@"📝 Trying specialized code editor extraction...");
    
    // Check accessibility permissions first
    BOOL accessibilityEnabled = AXIsProcessTrusted();
    NSLog(@"🔐 Accessibility permissions: %@", accessibilityEnabled ? @"GRANTED" : @"DENIED");
    
    if (!accessibilityEnabled) {
        NSLog(@"❌ Need to enable accessibility permissions:");
        NSLog(@"   Go to System Preferences > Security & Privacy > Privacy > Accessibility");
        NSLog(@"   Add this Electron app to the list");
        return [self getCodeEditorFallback:windowId];
    }
    
    NSString *accessibilityText = [self getCodeEditorAccessibilityText:windowId];
    if (accessibilityText && accessibilityText.length > 0) {
        return accessibilityText;
    }
    
    return [self getCodeEditorFallback:windowId];
}

- (NSString*)getTerminalText:(CGWindowID)windowId {
    NSLog(@"⌨️ Trying to extract terminal text...");
    // For now, use generic accessibility - can be enhanced later
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getMessagingAppText:(CGWindowID)windowId {
    NSLog(@"💬 Trying to extract messaging app text...");
    // For now, use generic accessibility - can be enhanced later
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getTextEditorContent:(CGWindowID)windowId {
    NSLog(@"📄 Trying to extract text editor content...");
    
    // Get the PID for this window  
    pid_t windowPid = 0;
    NSString *appName = @"";
    CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionIncludingWindow, windowId);
    
    if (windowList) {
        NSArray *windows = (__bridge_transfer NSArray*)windowList;
        
        for (NSDictionary *window in windows) {
            NSNumber *pid = window[(__bridge NSString*)kCGWindowOwnerPID];
            NSString *owner = window[(__bridge NSString*)kCGWindowOwnerName];
            
            if (pid && ([owner containsString:@"TextEdit"] || [owner isEqualToString:@"Notes"])) {
                windowPid = [pid intValue];
                appName = owner;
                NSLog(@"✅ Found text editor: %@ with PID: %d", owner, windowPid);
                break;
            }
        }
    }
    
    if (windowPid == 0) {
        NSLog(@"❌ Could not find text editor PID");
        return [self getGenericAccessibilityText:windowId];
    }
    
    @try {
        AXUIElementRef appElement = AXUIElementCreateApplication(windowPid);
        if (!appElement) {
            NSLog(@"❌ Could not create accessibility element for %@", appName);
            return [self getGenericAccessibilityText:windowId];
        }
        
        // Try to get focused element
        AXUIElementRef focusedElement = NULL;
        AXError focusResult = AXUIElementCopyAttributeValue(appElement, kAXFocusedUIElementAttribute, (CFTypeRef*)&focusedElement);
        
        NSLog(@"🎯 %@ focus result: %d", appName, focusResult);
        
        NSString *result = nil;
        
        if (focusResult == kAXErrorSuccess && focusedElement) {
            CFStringRef textContent = NULL;
            AXError textResult = AXUIElementCopyAttributeValue(focusedElement, kAXValueAttribute, (CFTypeRef*)&textContent);
            
            if (textResult == kAXErrorSuccess && textContent) {
                NSString *text = (__bridge NSString*)textContent;
                NSLog(@"✅ %@ SUCCESS! Extracted %lu characters", appName, (unsigned long)text.length);
                NSLog(@"📊 EXACT CHARACTER COUNT: %lu characters", (unsigned long)text.length);
                NSLog(@"📋 CONTENT PREVIEW: '%@'", [text length] > 200 ? [text substringToIndex:200] : text);
                
                // Create a copy to return (important for memory management)
                result = [NSString stringWithString:text];
                
                // Clean up
                CFRelease(textContent);
            }
            CFRelease(focusedElement);
        }
        
        // Always release the app element
        CFRelease(appElement);
        
        if (result) {
            return result;
        }
        
        NSLog(@"❌ No accessible text found in %@", appName);
        
    } @catch (NSException *exception) {
        NSLog(@"💥 Exception in %@ accessibility: %@", appName, exception.reason);
    }
    
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getCodeEditorAccessibilityText:(CGWindowID)windowId {
    NSLog(@"🔍 Starting detailed Cursor accessibility extraction...");
    
    @try {
        // Get the PID for this window
        pid_t windowPid = 0;
        CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionIncludingWindow, windowId);
        
        if (windowList) {
            NSArray *windows = (__bridge_transfer NSArray*)windowList;
            NSLog(@"🔍 Found %lu windows in list", (unsigned long)windows.count);
            
            for (NSDictionary *window in windows) {
                NSNumber *pid = window[(__bridge NSString*)kCGWindowOwnerPID];
                NSString *owner = window[(__bridge NSString*)kCGWindowOwnerName];
                NSLog(@"   Window: %@ (PID: %@)", owner, pid);
                
                if (pid && [owner isEqualToString:@"Cursor"]) {
                    windowPid = [pid intValue];
                    NSLog(@"✅ Found Cursor window with PID: %d", windowPid);
                    break;
                }
            }
        }
        
        if (windowPid == 0) {
            NSLog(@"❌ Could not find Cursor PID");
            return nil;
        }
        
        // Create accessibility element
        AXUIElementRef appElement = AXUIElementCreateApplication(windowPid);
        if (!appElement) {
            NSLog(@"❌ Could not create accessibility element for Cursor");
            return nil;
        }
        
        NSLog(@"✅ Created accessibility element for Cursor");
        
        // Try to get focused element
        AXUIElementRef focusedElement = NULL;
        AXError focusResult = AXUIElementCopyAttributeValue(appElement, kAXFocusedUIElementAttribute, (CFTypeRef*)&focusedElement);
        
        NSLog(@"🎯 Focus result: %d", focusResult);
        
        if (focusResult == kAXErrorSuccess && focusedElement) {
            NSLog(@"✅ Found focused element");
            
            // Get focused element role
            CFStringRef role = NULL;
            AXError roleResult = AXUIElementCopyAttributeValue(focusedElement, kAXRoleAttribute, (CFTypeRef*)&role);
            if (roleResult == kAXErrorSuccess && role) {
                NSLog(@"🎭 Focused element role: %@", (__bridge NSString*)role);
                CFRelease(role);
            }
            
            // Try different text attributes
            NSArray *textAttributes = @[
                (__bridge NSString*)kAXValueAttribute,
                (__bridge NSString*)kAXSelectedTextAttribute,
                (__bridge NSString*)kAXTitleAttribute,
                (__bridge NSString*)kAXDescriptionAttribute,
                (__bridge NSString*)kAXHelpAttribute
            ];
            
            for (NSString *attribute in textAttributes) {
                CFStringRef textContent = NULL;
                AXError textResult = AXUIElementCopyAttributeValue(focusedElement, (__bridge CFStringRef)attribute, (CFTypeRef*)&textContent);
                
                NSLog(@"📝 Trying attribute %@: result %d", attribute, textResult);
                
                if (textResult == kAXErrorSuccess && textContent) {
                    NSString *text = (__bridge NSString*)textContent;
                    NSLog(@"✅ Got text from %@: %lu chars", attribute, (unsigned long)text.length);
                    
                    if (text && text.length > 0) {
                        NSLog(@"📖 Content preview: %@", [text length] > 100 ? [text substringToIndex:100] : text);
                        CFRelease(textContent);
                        CFRelease(focusedElement);
                        CFRelease(appElement);
                        return text;
                    }
                    CFRelease(textContent);
                }
            }
            
            CFRelease(focusedElement);
        } else {
            NSLog(@"❌ Could not get focused element");
        }
        
        CFRelease(appElement);
        NSLog(@"❌ No accessible text found in Cursor");
        
    } @catch (NSException *exception) {
        NSLog(@"💥 Exception in Cursor accessibility: %@", exception.reason);
    }
    
    return nil;
}

- (NSString*)getCodeEditorFallback:(CGWindowID)windowId {
    NSString *windowTitle = [self getWindowTitle:windowId];
    NSLog(@"📝 Cursor fallback with title: '%@'", windowTitle);
    
    if (windowTitle && windowTitle.length > 0) {
        // Parse useful information from the window title
        NSMutableArray *contextParts = [NSMutableArray array];
        
        // Extract filename (look for parts with file extensions)
        NSArray *titleParts = [windowTitle componentsSeparatedByString:@" "];
        for (NSString *part in titleParts) {
            if ([part containsString:@"."] && part.length > 2) {
                // Found a filename
                [contextParts addObject:[NSString stringWithFormat:@"Editing file: %@", part]];
                
                // Detect file type for additional context
                NSString *lowerPart = [part lowercaseString];
                if ([lowerPart hasSuffix:@".ts"] || [lowerPart hasSuffix:@".js"]) {
                    [contextParts addObject:@"Working on TypeScript/JavaScript code"];
                } else if ([lowerPart hasSuffix:@".mm"] || [lowerPart hasSuffix:@".m"]) {
                    [contextParts addObject:@"Working on Objective-C/Objective-C++ code"];
                } else if ([lowerPart hasSuffix:@".py"]) {
                    [contextParts addObject:@"Working on Python code"];
                } else if ([lowerPart hasSuffix:@".java"]) {
                    [contextParts addObject:@"Working on Java code"];
                } else if ([lowerPart hasSuffix:@".cpp"] || [lowerPart hasSuffix:@".cc"]) {
                    [contextParts addObject:@"Working on C++ code"];
                } else if ([lowerPart hasSuffix:@".tsx"] || [lowerPart hasSuffix:@".jsx"]) {
                    [contextParts addObject:@"Working on React/JSX code"];
                }
                break;
            }
        }
        
        // Extract project name (usually after the "—" character)
        if ([windowTitle containsString:@"—"]) {
            NSArray *projectParts = [windowTitle componentsSeparatedByString:@"—"];
            if (projectParts.count >= 2) {
                NSString *projectName = [projectParts.lastObject stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
                [contextParts addObject:[NSString stringWithFormat:@"In project: %@", projectName]];
            }
        }
        
        if (contextParts.count > 0) {
            NSString *context = [contextParts componentsJoinedByString:@". "];
            NSLog(@"📝 Generated rich context: %@", context);
            NSLog(@"📊 EXACT CHARACTER COUNT: %lu characters", (unsigned long)context.length);
            NSLog(@"📋 EXACT CONTENT: '%@'", context);
            return context;
        } else {
            // Fallback: use the full window title
            NSString *fallback = [NSString stringWithFormat:@"Working in Cursor: %@", windowTitle];
            NSLog(@"📊 FALLBACK CHARACTER COUNT: %lu characters", (unsigned long)fallback.length);
            NSLog(@"📋 FALLBACK CONTENT: '%@'", fallback);
            return fallback;
        }
    }
    
    NSString *defaultMessage = @"Working in Cursor code editor";
    NSLog(@"📊 DEFAULT CHARACTER COUNT: %lu characters", (unsigned long)defaultMessage.length);
    NSLog(@"📋 DEFAULT CONTENT: '%@'", defaultMessage);
    return defaultMessage;
}

- (BOOL)shouldExcludeApp:(NSString*)ownerName withTitle:(NSString*)title {
    if (!ownerName) return NO;
    
    // For now, only exclude Electron apps (our productivity tracker)
    // but can also include other app names for example when we deploy this
    if ([ownerName isEqualToString:@"Electron"]) {
        // Get current process ID to compare
        int currentAppPid = [NSProcessInfo processInfo].processIdentifier;
        
        // Check if this Electron window belongs to our current process
        if (processId && processId.intValue == currentAppPid) {
            NSLog(@"🚫 EXCLUDING CURRENT ELECTRON APP");
            return YES;
        }
        
        // If it's a different Electron app, allow it to be tracked
        NSLog(@"✅ ALLOWING OTHER ELECTRON APP: %@ (different process)", title ?: @"Unknown");
    }
    
    return NO;
}

@end

void initActiveWindowObserver(Napi::Env env, Napi::Function windowCallback) {
    activeWindowChangedCallback = Napi::ThreadSafeFunction::New(env, windowCallback, "ActiveWindowChanged", 0, 1);
    windowObserver = [[ActiveWindowObserver alloc] init];
}

void stopActiveWindowObserver(Napi::Env env) {
    [windowObserver cleanUp];
    windowObserver = Nil;
    activeWindowChangedCallback.Abort();
    activeWindowChangedCallback = Nil;
}