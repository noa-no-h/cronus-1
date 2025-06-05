#import "activeWindowObserver.h"
#include <iostream>
#include <stdio.h> // For fprintf, stderr
#import <CoreGraphics/CoreGraphics.h>

// Custom Log Macro
#define MyLog(format, ...) fprintf(stderr, "%s\n", [[NSString stringWithFormat:format, ##__VA_ARGS__] UTF8String])

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
            MyLog(@"mainWindowChanged");
            NSDictionary *details = [(__bridge ActiveWindowObserver*)(refCon) getActiveWindow];
            if (details) {
                NSError *error;
                NSData *jsonData = [NSJSONSerialization dataWithJSONObject:details options:0 error:&error];
                if (!jsonData) {
                    MyLog(@"Error creating JSON data in windowChangeCallback: %@", error);
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
    // --- New ivars for Chrome tab tracking ---
    NSTimer *chromeTabCheckTimer;
    NSString *lastKnownChromeURL;
    NSString *lastKnownChromeTitle;
    BOOL isChromeActive; 
    // --- End new ivars ---
}

- (id)init {
    self = [super init];
    if (!self) return nil;

    // Check initial screen lock state
    CFDictionaryRef sessionDict = CGSessionCopyCurrentDictionary();
    if (sessionDict) {
        BOOL isLocked = CFDictionaryGetValue(sessionDict, kCGSessionOnConsoleKey) == kCFBooleanFalse;
        if (isLocked) {
            // Create a lock event with current timestamp
            NSMutableDictionary *lockEvent = [@{
                @"id": @0,
                @"ownerName": @"System Lock",
                @"title": @"Screen was locked",
                @"type": @"system",
                @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
            } mutableCopy];
            
            [self sendWindowInfoToJS:lockEvent withReason:@"system_lock_initial"];
        }
        CFRelease(sessionDict);
    }
    
    // Get both workspace and distributed notification centers
    NSNotificationCenter *workspaceCenter = [[NSWorkspace sharedWorkspace] notificationCenter];
    NSNotificationCenter *distributedCenter = [NSDistributedNotificationCenter defaultCenter];
    
    // Workspace notifications (sleep/wake)
    [workspaceCenter addObserver:self 
                       selector:@selector(receiveAppChangeNotification:) 
                           name:NSWorkspaceDidActivateApplicationNotification 
                         object:nil];
    
    [workspaceCenter addObserver:self
                       selector:@selector(receiveSleepNotification:)
                           name:NSWorkspaceWillSleepNotification
                         object:nil];
                                                           
    [workspaceCenter addObserver:self
                       selector:@selector(receiveWakeNotification:)
                           name:NSWorkspaceDidWakeNotification
                         object:nil];

    // Screen lock/unlock notifications (using distributed notifications)
    [distributedCenter addObserver:self
                        selector:@selector(receiveScreenLockNotification:)
                            name:@"com.apple.screenIsLocked"
                          object:nil];
    
    [distributedCenter addObserver:self
                        selector:@selector(receiveScreenUnlockNotification:)
                            name:@"com.apple.screenIsUnlocked"
                          object:nil];

    MyLog(@"🔧 DEBUG: Initialized observers for sleep/wake and lock/unlock events");
    
    // --- Initialize Chrome tab tracking ivars ---
    self->chromeTabCheckTimer = nil;
    self->lastKnownChromeURL = nil;
    self->lastKnownChromeTitle = nil;
    self->isChromeActive = NO;
    // --- End new ivar initialization ---
    
    return self;
}

- (void)receiveScreenLockNotification:(NSNotification *)notification {
    MyLog(@"🔒 DEBUG: Screen lock notification received");
    
    // Create a special lock event
    NSMutableDictionary *lockEvent = [@{
        @"id": @0,
        @"ownerName": @"System Lock",
        @"title": @"Screen was locked",
        @"type": @"system",
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    } mutableCopy];
    
    MyLog(@"🔒 DEBUG: Sending lock event to JS: %@", lockEvent);
    [self sendWindowInfoToJS:lockEvent withReason:@"system_lock"];
}

- (void)receiveScreenUnlockNotification:(NSNotification *)notification {
    MyLog(@"🔓 DEBUG: Screen unlock notification received");
    
    // Create an unlock event
    NSMutableDictionary *unlockEvent = [@{
        @"id": @0,
        @"ownerName": @"System Unlock",
        @"title": @"Screen was unlocked",
        @"type": @"system",
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    } mutableCopy];
    
    MyLog(@"🔓 DEBUG: Sending unlock event to JS: %@", unlockEvent);
    [self sendWindowInfoToJS:unlockEvent withReason:@"system_unlock"];
}

- (void)dealloc {
    [self stopChromeTabTimer]; // Ensure timer is stopped and released
    [lastKnownChromeURL release];
    lastKnownChromeURL = nil;
    [lastKnownChromeTitle release];
    lastKnownChromeTitle = nil;

    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [[NSDistributedNotificationCenter defaultCenter] removeObserver:self];
    [super dealloc];
}

// Add new methods to handle sleep/wake
- (void)receiveSleepNotification:(NSNotification *)notification {
    MyLog(@"💤 System going to sleep");
    
    // Create a special sleep event
    NSMutableDictionary *sleepEvent = [@{
        @"ownerName": @"System Sleep",
        @"title": @"Computer was sleeping",
        @"type": @"window",
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    } mutableCopy];
    
    [self sendWindowInfoToJS:sleepEvent withReason:@"system_sleep"];
}

- (void)receiveWakeNotification:(NSNotification *)notification {
    MyLog(@"⏰ System waking up");
    
    // Create a wake event to mark the end of sleep period
    NSMutableDictionary *wakeEvent = [@{
        @"ownerName": @"System Wake",
        @"title": @"Computer woke from sleep",
        @"type": @"window",
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    } mutableCopy];
    
    [self sendWindowInfoToJS:wakeEvent withReason:@"system_wake"];
}

// periodic backup timer
- (void)startPeriodicBackupTimer {
    [self stopPeriodicBackupTimer];
    
    // Check every 5 minutes as backup 
    periodicCheckTimer = [NSTimer scheduledTimerWithTimeInterval:300.0  
                                                        target:self
                                                      selector:@selector(periodicBackupCheck)
                                                      userInfo:nil
                                                       repeats:YES];
    [[NSRunLoop currentRunLoop] addTimer:periodicCheckTimer forMode:NSRunLoopCommonModes];
    MyLog(@"📅 Periodic backup timer started (5 min intervals)");
}

- (void)stopPeriodicBackupTimer {
    [periodicCheckTimer invalidate];
    periodicCheckTimer = nil;
    MyLog(@"📅 Periodic backup timer stopped");
}

// Backup check (only if user hasn't switched apps recently)
- (void)periodicBackupCheck {
    NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
    NSTimeInterval timeSinceLastSwitch = now - lastAppSwitchTime;
    
    MyLog(@"⏰ PERIODIC TIMER FIRED - Last switch: %.1f seconds ago", timeSinceLastSwitch);
    
    // Always capture periodic backup
    MyLog(@"📅 PERIODIC BACKUP: Capturing current state");
    
    NSDictionary *windowInfo = [self getActiveWindow];
    if (windowInfo) {
        NSString *currentApp = windowInfo[@"ownerName"];
        MyLog(@"📅 BACKUP CAPTURE: %@", currentApp);
        [self sendWindowInfoToJS:windowInfo withReason:@"periodic_backup"];
        lastTrackedApp = currentApp;
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

    // Capture the PID for this specific operation before the async block.
    NSNumber *currentOperationProcessId = self->processId; 
    NSRunningApplication *appBeforeDelay = [NSRunningApplication runningApplicationWithProcessIdentifier:currentOperationProcessId.intValue];
    NSString *expectedAppNameBeforeDelay = appBeforeDelay ? appBeforeDelay.localizedName : @"Unknown (PID lookup failed)";

    MyLog(@"[AppSwitch] Notification for app activation: %@ (PID %@)", expectedAppNameBeforeDelay, currentOperationProcessId);

    // After an app activation notification, there can be a slight delay before the system
    // fully updates its window list. Introduce a brief pause here to ensure that when
    // we query for the active window, we get the newly activated app, not the previous one.
    // Introduce a small delay to allow system window state to update
    NSTimeInterval delayInMSec = 100;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInMSec * NSEC_PER_MSEC));
    
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
        MyLog(@"[AppSwitch] After %.0fms delay, processing for PID %@", delayInMSec, currentOperationProcessId);
        NSDictionary *details = [self getActiveWindow]; // Attempt to get the new active window
        
        if (details) {
            NSString *ownerNameFromDetails = details[@"ownerName"];
            MyLog(@"[AppSwitch]   Active window found: %@. Expected app: %@.", ownerNameFromDetails, expectedAppNameBeforeDelay);
            
            // Update tracking variables and send data
            self->lastTrackedApp = ownerNameFromDetails;
            [self sendWindowInfoToJS:details withReason:@"app_switch"];
        } else {
             MyLog(@"[AppSwitch]   No active window details found after delay for PID: %@", currentOperationProcessId);
        }

        // Setup observer for the new application
        AXUIElementRef appElem = AXUIElementCreateApplication(currentOperationProcessId.intValue);
        if (!appElem) {
            MyLog(@"[AppSwitch]   Failed to create AXUIElement for PID %@", currentOperationProcessId);
            return;
        }
        
        // self->observer should be Nil here due to [self removeWindowObserver] at the start of receiveAppChangeNotification
        AXError createResult = AXObserverCreate(currentOperationProcessId.intValue, windowChangeCallback, &(self->observer));

        if (createResult != kAXErrorSuccess) {
            MyLog(@"[AppSwitch]   AXObserverCreate failed for PID %@: Error %d", currentOperationProcessId, createResult);
            CFRelease(appElem); // Release appElem if observer creation fails
            return;
        }

        AXObserverAddNotification(self->observer, appElem, kAXMainWindowChangedNotification, (__bridge void *)(self));
        CFRunLoopAddSource([[NSRunLoop currentRunLoop] getCFRunLoop], AXObserverGetRunLoopSource(self->observer), kCFRunLoopDefaultMode);
        
        CFRelease(appElem); // Release the element as its information has been registered
        MyLog(@"[AppSwitch]   Observers added for PID %@ (%@)", currentOperationProcessId, expectedAppNameBeforeDelay);
    });
}

// Centralized method to send data to JavaScript
- (void)sendWindowInfoToJS:(NSDictionary*)windowInfo withReason:(NSString*)reason {
    NSMutableDictionary *enrichedInfo = [windowInfo mutableCopy];
    enrichedInfo[@"captureReason"] = reason;  // "app_switch", "periodic_backup", "chrome_tab_switch", etc.
    enrichedInfo[@"timestamp"] = @([[NSDate date] timeIntervalSince1970] * 1000);
    
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:enrichedInfo options:0 error:&error];
    if (!jsonData) {
        MyLog(@"Error creating JSON data: %@", error);
        return;
    }
    
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    std::string* result = new std::string([jsonString UTF8String]);
    activeWindowChangedCallback.BlockingCall(result, napiCallback);
    
    MyLog(@"📤 SENT TO JS: %@ (%@)", enrichedInfo[@"ownerName"], reason);
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

        MyLog(@"🔍 ACTIVE WINDOW CHANGED:");
        MyLog(@"   Owner: %@", windowOwnerName);
        MyLog(@"   Title: %@", windowTitle);
        MyLog(@"   Type: %@", windowInfo[@"type"]);
        
        // --- Start Chrome Tab Timer Management within getActiveWindow ---
        if ([windowOwnerName isEqualToString:@"Google Chrome"]) {
            if (!self->isChromeActive) { // Chrome just became the active app's window owner
                MyLog(@"[Chrome Tab] Chrome became active window. Initializing tab tracking.");
                self->isChromeActive = YES;
                // Timer will be started. Initial lastKnownURL/Title will be set after chromeInfo is fetched below.
                [self startChromeTabTimer];
            }
        } else { // Active window is not Chrome
            if (self->isChromeActive) { // Chrome was active, but no longer is
                MyLog(@"[Chrome Tab] Chrome no longer active window.");
                self->isChromeActive = NO;
                [self stopChromeTabTimer];
                [lastKnownChromeURL release]; self->lastKnownChromeURL = nil;
                [lastKnownChromeTitle release]; self->lastKnownChromeTitle = nil;
            }
        }
        // --- End Chrome Tab Timer Management ---

        // Check for browser windows
        if ([windowOwnerName isEqualToString:@"Google Chrome"]) {
            NSDictionary *chromeInfo = [self getChromeTabInfo];
            if (chromeInfo) {
                [windowInfo addEntriesFromDictionary:chromeInfo];
                windowInfo[@"type"] = @"browser";
                windowInfo[@"browser"] = @"chrome";

                // If Chrome is active and this is the first time we're getting its info
                // (e.g., after Chrome activation), set the baseline for tab change detection.
                if (self->isChromeActive && self->lastKnownChromeURL == nil && chromeInfo[@"url"]) {
                    MyLog(@"[Chrome Tab] Setting initial known tab: URL=%@, Title=%@", chromeInfo[@"url"], chromeInfo[@"title"]);
                    [self->lastKnownChromeURL release];
                    self->lastKnownChromeURL = [chromeInfo[@"url"] copy];
                    [self->lastKnownChromeTitle release];
                    self->lastKnownChromeTitle = [chromeInfo[@"title"] copy];
                }
            }
        } else if ([windowOwnerName isEqualToString:@"Safari"]) {
            NSDictionary *safariInfo = [self getSafariTabInfo];
            if (safariInfo) {
                [windowInfo addEntriesFromDictionary:safariInfo];
                windowInfo[@"type"] = @"browser";
                windowInfo[@"browser"] = @"safari";
            }
        } else {
            MyLog(@"   ⚠️  NON-BROWSER APP - Only title available: '%@'", windowTitle);
            NSString *extractedText = [self getAppTextContent:windowOwnerName windowId:windowId];
        if (extractedText && extractedText.length > 0) {
            windowInfo[@"content"] = extractedText;
            MyLog(@"   ✅ Extracted %lu characters from %@", (unsigned long)[extractedText length], windowOwnerName);
            MyLog(@"   Content preview: %@", [extractedText length] > 200 ? [extractedText substringToIndex:200] : extractedText);
        } else {
            MyLog(@"   ⚠️  No text content extracted from %@", windowOwnerName);
        }
        }

    //     // get the app icon path 
    //    NSString *iconPath = [self getAppIconPath:windowOwnerName];  
    //     if (iconPath) {
    //         [windowInfo setObject:iconPath forKey:@"iconPath"];  
    //     }
        
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
    MyLog(@"Starting Chrome tab info gathering...");
    
    // First check if Chrome is running
    NSRunningApplication *chromeApp = [[NSRunningApplication runningApplicationsWithBundleIdentifier:@"com.google.Chrome"] firstObject];
    if (!chromeApp) {
        MyLog(@"Chrome is not running");
        return nil;
    }
    
    // Check if Chrome is frontmost
    if (![chromeApp isActive]) {
        MyLog(@"Chrome is not the active application");
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
        MyLog(@"Basic AppleScript error: %@", error);
        return nil;
    }
    
    NSString *basicInfo = [basicResult stringValue];
    if (!basicInfo || [basicInfo hasPrefix:@"ERROR|"]) {
        MyLog(@"Basic script error: %@", basicInfo);
        return nil;
    }
    
    NSArray *basicComponents = [basicInfo componentsSeparatedByString:@"|"];
    if (basicComponents.count < 2) {
        MyLog(@"Invalid basic info components");
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
                MyLog(@"JavaScript is disabled in Chrome. Please enable it in View > Developer > Allow JavaScript from Apple Events");
            } else {
                tabInfo[@"content"] = jsInfo;
                MyLog(@"🎯 CHROME CONTENT CAPTURED:");
                MyLog(@"   App: %@", tabInfo[@"url"]);
                MyLog(@"   Title: %@", tabInfo[@"title"]);
                MyLog(@"   Content Length: %lu characters", (unsigned long)[jsInfo length]);
                MyLog(@"   Content Preview (first 200 chars): %@", [jsInfo length] > 200 ? [jsInfo substringToIndex:200] : jsInfo);
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
                            MyLog(@"JavaScript is disabled in Safari. Please enable it in Safari > Settings > Advanced > Allow JavaScript from Apple Events");
                        } else {
                            tabInfo[@"content"] = content;
                            MyLog(@"Successfully got Safari content, length: %lu", (unsigned long)[content length]);
                            MyLog(@"🎯 SAFARI CONTENT CAPTURED:");
                            MyLog(@"   URL: %@", tabInfo[@"url"]);
                            MyLog(@"   Title: %@", tabInfo[@"title"]);
                            MyLog(@"   Content Length: %lu characters", (unsigned long)[content length]);
                            MyLog(@"   Content Preview (first 200 chars): %@", [content length] > 200 ? [content substringToIndex:200] : content);
                        }
                    }
                }
                
                tabInfo[@"browser"] = @"safari";
                return tabInfo;
            }
        }
    }
    
    if (error) {
        MyLog(@"Safari AppleScript error: %@", error);
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

            MyLog(@"Window bounds (scaled): %@", NSStringFromRect(NSRectFromCGRect(bounds)));

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
        MyLog(@"Failed to create window image");
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
    MyLog(@"Screenshot timer started");
}

- (void)stopScreenshotTimer {
    [screenshotTimer invalidate];
    screenshotTimer = nil;
    MyLog(@"Screenshot timer stopped");
}

- (void)takeScreenshot {
    NSDictionary *windowInfo = [self getActiveWindow];
    if (!windowInfo) return;
    
    CGWindowID windowId = [[windowInfo objectForKey:@"id"] unsignedIntValue];
    NSData *screenshotData = [self captureWindowScreenshot:windowId];
    
    if (!screenshotData) {
        MyLog(@"Failed to capture screenshot");
        return;
    }
    
    // Save screenshot to a temporary file
    NSString *tempDir = NSTemporaryDirectory();
    NSString *fileName = [NSString stringWithFormat:@"%@.jpg", [[NSUUID UUID] UUIDString]];
    NSString *filePath = [tempDir stringByAppendingPathComponent:fileName];
    BOOL success = [screenshotData writeToFile:filePath atomically:YES];

    if (!success) {
        MyLog(@"Failed to save screenshot to temp file: %@", filePath);
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
        MyLog(@"Error creating JSON data: %@", error);
        return;
    }
    
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    std::string* result = new std::string([jsonString UTF8String]);
    activeWindowChangedCallback.BlockingCall(result, napiCallback);
    MyLog(@"Screenshot captured, saved to %@, and event sent", filePath);
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
    [self stopChromeTabTimer];
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [self removeWindowObserver];
}

- (NSString*)getAppTextContent:(NSString*)ownerName windowId:(CGWindowID)windowId {
    MyLog(@"🔍 Attempting to extract text from: %@", ownerName);
    
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
                    
                    MyLog(@"✅ Generic accessibility text extracted: %lu chars", (unsigned long)[text length]);
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
                        
                        MyLog(@"✅ Focused element text extracted: %lu chars", (unsigned long)[text length]);
                        return text;
                    }
                    CFRelease(focusedElement);
                }
            }
            CFRelease(windowList);
        }
        CFRelease(systemElement);
    } @catch (NSException *exception) {
        MyLog(@"❌ Error extracting accessibility text: %@", exception.reason);
    }
    
    return nil;
}

// Add the missing method implementations:
- (NSString*)getCodeEditorText:(CGWindowID)windowId {
    MyLog(@"📝 Trying specialized code editor extraction...");
    
    // Check accessibility permissions first
    BOOL accessibilityEnabled = AXIsProcessTrusted();
    MyLog(@"🔐 Accessibility permissions: %@", accessibilityEnabled ? @"GRANTED" : @"DENIED");
    
    if (!accessibilityEnabled) {
        MyLog(@"❌ Need to enable accessibility permissions:");
        MyLog(@"   Go to System Preferences > Security & Privacy > Privacy > Accessibility");
        MyLog(@"   Add this Electron app to the list");
        return [self getCodeEditorFallback:windowId];
    }
    
    NSString *accessibilityText = [self getCodeEditorAccessibilityText:windowId];
    if (accessibilityText && accessibilityText.length > 0) {
        return accessibilityText;
    }
    
    return [self getCodeEditorFallback:windowId];
}

- (NSString*)getTerminalText:(CGWindowID)windowId {
    MyLog(@"⌨️ Trying to extract terminal text...");
    // For now, use generic accessibility - can be enhanced later
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getMessagingAppText:(CGWindowID)windowId {
    MyLog(@"💬 Trying to extract messaging app text...");
    // For now, use generic accessibility - can be enhanced later
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getTextEditorContent:(CGWindowID)windowId {
    MyLog(@"📄 Trying to extract text editor content...");
    
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
                MyLog(@"✅ Found text editor: %@ with PID: %d", owner, windowPid);
                break;
            }
        }
    }
    
    if (windowPid == 0) {
        MyLog(@"❌ Could not find text editor PID");
        return [self getGenericAccessibilityText:windowId];
    }
    
    @try {
        AXUIElementRef appElement = AXUIElementCreateApplication(windowPid);
        if (!appElement) {
            MyLog(@"❌ Could not create accessibility element for %@", appName);
            return [self getGenericAccessibilityText:windowId];
        }
        
        // Try to get focused element
        AXUIElementRef focusedElement = NULL;
        AXError focusResult = AXUIElementCopyAttributeValue(appElement, kAXFocusedUIElementAttribute, (CFTypeRef*)&focusedElement);
        
        MyLog(@"🎯 %@ focus result: %d", appName, focusResult);
        
        NSString *result = nil;
        
        if (focusResult == kAXErrorSuccess && focusedElement) {
            CFStringRef textContent = NULL;
            AXError textResult = AXUIElementCopyAttributeValue(focusedElement, kAXValueAttribute, (CFTypeRef*)&textContent);
            
            if (textResult == kAXErrorSuccess && textContent) {
                NSString *text = (__bridge NSString*)textContent;
                MyLog(@"✅ %@ SUCCESS! Extracted %lu characters", appName, (unsigned long)text.length);
                MyLog(@"📊 EXACT CHARACTER COUNT: %lu characters", (unsigned long)text.length);
                MyLog(@"📋 CONTENT PREVIEW: '%@'", [text length] > 200 ? [text substringToIndex:200] : text);
                
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
        
        MyLog(@"❌ No accessible text found in %@", appName);
        
    } @catch (NSException *exception) {
        MyLog(@"💥 Exception in %@ accessibility: %@", appName, exception.reason);
    }
    
    return [self getGenericAccessibilityText:windowId];
}

- (NSString*)getCodeEditorAccessibilityText:(CGWindowID)windowId {
    MyLog(@"🔍 Starting detailed Cursor accessibility extraction...");
    
    @try {
        // Get the PID for this window
        pid_t windowPid = 0;
        CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionIncludingWindow, windowId);
        
        if (windowList) {
            NSArray *windows = (__bridge_transfer NSArray*)windowList;
            MyLog(@"🔍 Found %lu windows in list", (unsigned long)windows.count);
            
            for (NSDictionary *window in windows) {
                NSNumber *pid = window[(__bridge NSString*)kCGWindowOwnerPID];
                NSString *owner = window[(__bridge NSString*)kCGWindowOwnerName];
                MyLog(@"   Window: %@ (PID: %@)", owner, pid);
                
                if (pid && [owner isEqualToString:@"Cursor"]) {
                    windowPid = [pid intValue];
                    MyLog(@"✅ Found Cursor window with PID: %d", windowPid);
                    break;
                }
            }
        }
        
        if (windowPid == 0) {
            MyLog(@"❌ Could not find Cursor PID");
            return nil;
        }
        
        // Create accessibility element
        AXUIElementRef appElement = AXUIElementCreateApplication(windowPid);
        if (!appElement) {
            MyLog(@"❌ Could not create accessibility element for Cursor");
            return nil;
        }
        
        MyLog(@"✅ Created accessibility element for Cursor");
        
        // Try to get focused element
        AXUIElementRef focusedElement = NULL;
        AXError focusResult = AXUIElementCopyAttributeValue(appElement, kAXFocusedUIElementAttribute, (CFTypeRef*)&focusedElement);
        
        MyLog(@"🎯 Focus result: %d", focusResult);
        
        if (focusResult == kAXErrorSuccess && focusedElement) {
            MyLog(@"✅ Found focused element");
            
            // Get focused element role
            CFStringRef role = NULL;
            AXError roleResult = AXUIElementCopyAttributeValue(focusedElement, kAXRoleAttribute, (CFTypeRef*)&role);
            if (roleResult == kAXErrorSuccess && role) {
                MyLog(@"🎭 Focused element role: %@", (__bridge NSString*)role);
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
                
                MyLog(@"📝 Trying attribute %@: result %d", attribute, textResult);
                
                if (textResult == kAXErrorSuccess && textContent) {
                    NSString *text = (__bridge NSString*)textContent;
                    MyLog(@"✅ Got text from %@: %lu chars", attribute, (unsigned long)text.length);
                    
                    if (text && text.length > 0) {
                        MyLog(@"📖 Content preview: %@", [text length] > 100 ? [text substringToIndex:100] : text);
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
            MyLog(@"❌ Could not get focused element");
        }
        
        CFRelease(appElement);
        MyLog(@"❌ No accessible text found in Cursor");
        
    } @catch (NSException *exception) {
        MyLog(@"💥 Exception in Cursor accessibility: %@", exception.reason);
    }
    
    return nil;
}

- (NSString*)getCodeEditorFallback:(CGWindowID)windowId {
    NSString *windowTitle = [self getWindowTitle:windowId];
    MyLog(@"📝 Cursor fallback with title: '%@'", windowTitle);
    
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
            MyLog(@"📝 Generated rich context: %@", context);
            MyLog(@"📊 EXACT CHARACTER COUNT: %lu characters", (unsigned long)context.length);
            MyLog(@"📋 EXACT CONTENT: '%@'", context);
            return context;
        } else {
            // Fallback: use the full window title
            NSString *fallback = [NSString stringWithFormat:@"Working in Cursor: %@", windowTitle];
            MyLog(@"📊 FALLBACK CHARACTER COUNT: %lu characters", (unsigned long)fallback.length);
            MyLog(@"📋 FALLBACK CONTENT: '%@'", fallback);
            return fallback;
        }
    }
    
    NSString *defaultMessage = @"Working in Cursor code editor";
    MyLog(@"📊 DEFAULT CHARACTER COUNT: %lu characters", (unsigned long)defaultMessage.length);
    MyLog(@"📋 DEFAULT CONTENT: '%@'", defaultMessage);
    return defaultMessage;
}

- (BOOL)shouldExcludeApp:(NSString*)ownerName withTitle:(NSString*)title {
    if (!ownerName) return NO;
    
    // First check: Exclude system UI elements
    if ([ownerName isEqualToString:@"Dock"] ||
        [ownerName isEqualToString:@"Finder"] ||
        [ownerName isEqualToString:@"SystemUIServer"]) {
        MyLog(@"🚫 Excluding system UI element: %@", ownerName);
        return YES;
    }
    
    // Second check: Handle Electron windows
    if ([ownerName isEqualToString:@"Electron"]) {
        // Get the current app's PID
        int currentAppPid = [NSProcessInfo processInfo].processIdentifier;
        
        NSArray *windows = (__bridge NSArray *)CGWindowListCopyWindowInfo(
            kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, 
            kCGNullWindowID
        );
        
        for (NSDictionary *window in windows) {
            NSString *windowOwner = [window objectForKey:(id)kCGWindowOwnerName];
            NSNumber *windowPid = [window objectForKey:(id)kCGWindowOwnerPID];
            NSNumber *windowLayer = [window objectForKey:(id)kCGWindowLayer];
            
            // Check if this is the frontmost Electron window
            if ([windowOwner isEqualToString:@"Electron"] && 
                [windowLayer intValue] == 0 && 
                windowPid && 
                [windowPid intValue] == currentAppPid) {
                
                MyLog(@"🔎 TRACKING CURRENT ELECTRON APP (PID: %d)", currentAppPid);
                // return YES; // No longer excluding
            }
        }
    }
    
    return NO;
}

- (NSString*)getAppIconPath:(NSString*)appName {
    NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
    
    // Create icons directory if it doesn't exist
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES);
    NSString *cachesDirectory = [paths firstObject];
    NSString *iconsDirectory = [cachesDirectory stringByAppendingPathComponent:@"app-icons"];
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    if (![fileManager fileExistsAtPath:iconsDirectory]) {
        NSError *error = nil;  // 🔧 Initialize to nil
        BOOL success = [fileManager createDirectoryAtPath:iconsDirectory 
                                  withIntermediateDirectories:YES 
                                                   attributes:nil 
                                                        error:&error];
        if (!success || error) {  // 🔧 Check both success and error
            MyLog(@"🚨 Failed to create icons directory: %@", error ? [error localizedDescription] : @"Unknown error");
            return nil;
        }
    }
    
    // Create safe filename from app name
    NSString *safeAppName = [appName stringByReplacingOccurrencesOfString:@" " withString:@"-"];
    safeAppName = [safeAppName stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    safeAppName = [safeAppName stringByReplacingOccurrencesOfString:@":" withString:@"-"];  // 🔧 Also handle colons
    NSString *iconPath = [iconsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.png", safeAppName]];
    
    // Check if icon already exists
    if ([fileManager fileExistsAtPath:iconPath]) {
        MyLog(@"✅ Using cached icon for %@: %@", appName, iconPath);
        return iconPath;
    }
    
    // Try to find the app and get its icon
    NSArray *runningApps = [workspace runningApplications];
    for (NSRunningApplication *app in runningApps) {
        if ([app.localizedName isEqualToString:appName] || 
            [app.bundleIdentifier containsString:appName.lowercaseString]) {
            
            // Get the app icon directly from NSWorkspace
            NSImage *appIcon = [workspace iconForFile:app.bundleURL.path];
            if (appIcon) {
                // Resize to 32x32
                NSSize newSize = NSMakeSize(32, 32);
                NSImage *resizedIcon = [[NSImage alloc] initWithSize:newSize];
                [resizedIcon lockFocus];
                [appIcon drawInRect:NSMakeRect(0, 0, newSize.width, newSize.height)
                           fromRect:NSZeroRect
                          operation:NSCompositingOperationCopy
                           fraction:1.0];
                [resizedIcon unlockFocus];
                
                // Convert to PNG data
                CGImageRef cgImage = [resizedIcon CGImageForProposedRect:nil context:nil hints:nil];
                if (cgImage) {  // 🔧 Check if cgImage is valid
                    NSBitmapImageRep *bitmapRep = [[NSBitmapImageRep alloc] initWithCGImage:cgImage];
                    NSData *pngData = [bitmapRep representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
                    
                    if (pngData) {
                        // Save to file
                        NSError *writeError = nil;  // 🔧 Use different variable name
                        BOOL writeSuccess = [pngData writeToFile:iconPath options:NSDataWritingAtomic error:&writeError];
                        if (!writeSuccess || writeError) {  // 🔧 Check both success and error
                            MyLog(@"🚨 Failed to save icon for %@: %@", appName, writeError ? [writeError localizedDescription] : @"Unknown write error");
                            return nil;
                        }
                        
                        MyLog(@"🎨 Generated icon file for %@ (%lu bytes): %@", appName, (unsigned long)pngData.length, iconPath);
                        return iconPath;
                    } else {
                        MyLog(@"🚨 Failed to convert icon to PNG data for %@", appName);
                    }
                } else {
                    MyLog(@"🚨 Failed to create CGImage for %@", appName);
                }
                
                // Clean up
                [resizedIcon release];
            } else {
                MyLog(@"🚨 No icon found for app %@", appName);
            }
        }
    }
    
    MyLog(@"🎨 No icon found for %@", appName);
    return nil;
}

// --- New methods for Chrome Tab Tracking ---

- (NSDictionary*)getCurrentChromeTabBriefInfo {
    NSString *scriptSource = @"tell application \"Google Chrome\"\n\
  try\n\
    if not (exists front window) then return \"ERROR|No window\"\n\
    set activeTab to active tab of front window\n\
    set tabUrl to URL of activeTab\n\
    set tabTitle to title of activeTab\n\
    return tabUrl & \"|\" & tabTitle\n\
  on error errMsg\n\
    return \"ERROR|\" & errMsg\n\
  end try\n\
end tell";
    NSAppleScript *appleScript = [[NSAppleScript alloc] initWithSource:scriptSource];
    NSDictionary *errorInfo = nil;
    NSAppleEventDescriptor *descriptor = [appleScript executeAndReturnError:&errorInfo];
    [appleScript release];

    if (errorInfo) {
        MyLog(@"[Chrome Tab Brief] AppleScript execution error: %@", errorInfo);
        return nil;
    }

    NSString *resultString = [descriptor stringValue];
    if (!resultString || [resultString hasPrefix:@"ERROR|"]) {
        if (resultString && ![resultString isEqualToString:@"ERROR|No window"]) { // Don't log for "No window" as it's common
             MyLog(@"[Chrome Tab Brief] AppleScript reported error: %@", resultString);
        }
        return nil;
    }
    
    NSArray *components = [resultString componentsSeparatedByString:@"|"];
    if (components.count >= 1) { // URL is component 0, title might be empty if not present.
        NSString *url = components[0];
        NSString *title = (components.count > 1) ? components[1] : @""; // Handle missing title gracefully
        return @{@"url": url, @"title": title};
    }
    
    MyLog(@"[Chrome Tab Brief] Invalid components from AppleScript: %@", resultString);
    return nil;
}

- (void)startChromeTabTimer {
    if (self->chromeTabCheckTimer) { // Already running or improperly cleaned up
        [self->chromeTabCheckTimer invalidate];
        [self->chromeTabCheckTimer release];
        self->chromeTabCheckTimer = nil;
    }
    // Check every 1.5 seconds
    self->chromeTabCheckTimer = [[NSTimer scheduledTimerWithTimeInterval:1.5
                                                                target:self
                                                              selector:@selector(performChromeTabCheck)
                                                              userInfo:nil
                                                               repeats:YES] retain];
    [[NSRunLoop currentRunLoop] addTimer:self->chromeTabCheckTimer forMode:NSRunLoopCommonModes];
    MyLog(@"[Chrome Tab] ▶️ Chrome tab check timer started.");
}

- (void)stopChromeTabTimer {
    if (self->chromeTabCheckTimer) {
        [self->chromeTabCheckTimer invalidate];
        [self->chromeTabCheckTimer release];
        self->chromeTabCheckTimer = nil;
        MyLog(@"[Chrome Tab] ⏹️ Chrome tab check timer stopped.");
    }
}

- (void)performChromeTabCheck {
    if (!self->isChromeActive) {
        // This check is a safeguard; the timer should ideally be stopped when Chrome is not active.
        // MyLog(@"[Chrome Tab] performChromeTabCheck called while Chrome not active. Stopping timer.");
        // [self stopChromeTabTimer]; // This might lead to issues if called from timer thread directly, safer to let getActiveWindow manage state.
        return;
    }

    NSDictionary *briefTabInfo = [self getCurrentChromeTabBriefInfo];
    if (briefTabInfo) {
        NSString *currentURL = briefTabInfo[@"url"];     // Can be nil
        NSString *currentTitle = briefTabInfo[@"title"]; // Can be nil

        // Check for changes, handles nil comparisons correctly
        BOOL urlChanged = (self->lastKnownChromeURL || currentURL) && ![self->lastKnownChromeURL isEqualToString:currentURL];
        BOOL titleChanged = (self->lastKnownChromeTitle || currentTitle) && ![self->lastKnownChromeTitle isEqualToString:currentTitle];

        if (urlChanged || titleChanged) {
            MyLog(@"[Chrome Tab] 🔄 Chrome Tab Switch Detected:");
            if (urlChanged) MyLog(@"   URL: '%@' -> '%@'", self->lastKnownChromeURL, currentURL);
            if (titleChanged) MyLog(@"   Title: '%@' -> '%@'", self->lastKnownChromeTitle, currentTitle);

            // Update known state
            NSString *newURL = [currentURL copy];
            [self->lastKnownChromeURL release];
            self->lastKnownChromeURL = newURL;

            NSString *newTitle = [currentTitle copy];
            [self->lastKnownChromeTitle release];
            self->lastKnownChromeTitle = newTitle;
            
            // Get full window details for the new tab state
            NSDictionary *activeWindowDetails = [self getActiveWindow]; // This will fetch full content etc.
            if (activeWindowDetails) {
                if ([activeWindowDetails[@"ownerName"] isEqualToString:@"Google Chrome"]) {
                    MyLog(@"   Sending full details for new tab state (Owner: %@, Title: %@, URL: %@)", 
                          activeWindowDetails[@"ownerName"], 
                          activeWindowDetails[@"title"],
                          activeWindowDetails[@"url"]); // url is present from getChromeTabInfo
                    [self sendWindowInfoToJS:activeWindowDetails withReason:@"chrome_tab_switch"];
                } else {
                    MyLog(@"   WARNING: Tab switch detected, but getActiveWindow returned non-Chrome app: %@", activeWindowDetails[@"ownerName"]);
                    // This case implies Chrome might have lost focus between brief check and full getActiveWindow.
                    // The main getActiveWindow logic should handle stopping the timer if Chrome is no longer active.
                }
            } else {
                 MyLog(@"   Could not get active window details after tab switch.");
            }
        }
    } else {
        // MyLog(@"[Chrome Tab] Could not get brief Chrome tab info during check. Chrome might have no windows or script failed.");
    }
}

// --- End new methods ---

@end

void initActiveWindowObserver(Napi::Env env, Napi::Function windowCallback) {
    activeWindowChangedCallback = Napi::ThreadSafeFunction::New(env, windowCallback, "ActiveWindowChanged", 0, 1);
    windowObserver = [[ActiveWindowObserver alloc] init];
}

void stopActiveWindowObserver(Napi::Env env) {
    [windowObserver cleanUp];
    [windowObserver release]; // Release the observer instance itself
    windowObserver = Nil;
    activeWindowChangedCallback.Abort();
    activeWindowChangedCallback = Nil;
}