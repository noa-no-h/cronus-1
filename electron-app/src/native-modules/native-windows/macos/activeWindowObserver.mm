#import "activeWindowObserver.h"
#import "sleepAndLockObserver.h"
#import "browserTabUtils.h"
#import "chromeTabTracking.h"
#import "contentExtractor.h"
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
    NSTimer *periodicCheckTimer;          
    NSString *lastTrackedApp;             
    NSTimeInterval lastAppSwitchTime;    
    BOOL isCurrentlyTracking;
    ChromeTabTracking *chromeTabTracking;
    SleepAndLockObserver *sleepAndLockObserver;
}

- (id)init {
    self = [super init];
    if (!self) return nil;

    sleepAndLockObserver = [[SleepAndLockObserver alloc] initWithWindowObserver:self];
    chromeTabTracking = [[ChromeTabTracking alloc] init];
    chromeTabTracking.delegate = self;
    
    // Get both workspace and distributed notification centers
    NSNotificationCenter *workspaceCenter = [[NSWorkspace sharedWorkspace] notificationCenter];
    
    // Workspace notifications (sleep/wake)
    [workspaceCenter addObserver:self 
                       selector:@selector(receiveAppChangeNotification:) 
                           name:NSWorkspaceDidActivateApplicationNotification 
                         object:nil];
    
    MyLog(@"🔧 DEBUG: Initialized observers for sleep/wake and lock/unlock events");
    
    return self;
}

- (void)dealloc {
    [chromeTabTracking release];
    chromeTabTracking = nil;
    [sleepAndLockObserver release];
    sleepAndLockObserver = nil;

    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [[NSDistributedNotificationCenter defaultCenter] removeObserver:self];
    [super dealloc];
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
            if (!chromeTabTracking.isChromeActive) { // Chrome just became the active app's window owner
                MyLog(@"[Chrome Tab] Chrome became active window. Initializing tab tracking.");
                chromeTabTracking.isChromeActive = YES;
                [chromeTabTracking startChromeTabTimer];
            }
        } else { // Active window is not Chrome
            if (chromeTabTracking.isChromeActive) { // Chrome was active, but no longer is
                MyLog(@"[Chrome Tab] Chrome no longer active window.");
                chromeTabTracking.isChromeActive = NO;
                [chromeTabTracking stopChromeTabTimer];
                chromeTabTracking.lastKnownChromeURL = nil;
                chromeTabTracking.lastKnownChromeTitle = nil;
            }
        }
        // --- End Chrome Tab Timer Management ---

        // Check for browser windows
        if ([windowOwnerName isEqualToString:@"Google Chrome"]) {
            NSDictionary *chromeInfo = [BrowserTabUtils getChromeTabInfo];
            if (chromeInfo) {
                [windowInfo addEntriesFromDictionary:chromeInfo];

                // If Chrome is active and this is the first time we're getting its info
                // (e.g., after Chrome activation), set the baseline for tab change detection.
                if (chromeTabTracking.isChromeActive && chromeTabTracking.lastKnownChromeURL == nil && chromeInfo[@"url"]) {
                    MyLog(@"[Chrome Tab] Setting initial known tab: URL=%@, Title=%@", chromeInfo[@"url"], chromeInfo[@"title"]);
                    chromeTabTracking.lastKnownChromeURL = [chromeInfo[@"url"] copy];
                    chromeTabTracking.lastKnownChromeTitle = [chromeInfo[@"title"] copy];
                }
            }
        } else if ([windowOwnerName isEqualToString:@"Safari"]) {
            NSDictionary *safariInfo = [BrowserTabUtils getSafariTabInfo];
            if (safariInfo) {
                [windowInfo addEntriesFromDictionary:safariInfo];
            }
        } else {
            MyLog(@"   ⚠️  NON-BROWSER APP - Only title available: '%@'", windowTitle);
            NSString *extractedText = [ContentExtractor getAppTextContent:windowOwnerName windowId:windowId];
            if (extractedText && extractedText.length > 0) {
                windowInfo[@"content"] = extractedText;
                MyLog(@"   ✅ Extracted %lu characters from %@", (unsigned long)[extractedText length], windowOwnerName);
                MyLog(@"   Content preview: %@", [extractedText length] > 200 ? [extractedText substringToIndex:200] : extractedText);
            } else {
                MyLog(@"   ⚠️  No text content extracted from %@", windowOwnerName);
            }
        }
        
        return windowInfo;
    }
    return nil;
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
    [self stopPeriodicBackupTimer];    
    [chromeTabTracking stopChromeTabTimer];
    [sleepAndLockObserver stopObserving];
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [self removeWindowObserver];
}

// App exclusion related

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

// App icon related

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

- (void)chromeTabDidSwitch:(NSDictionary *)newTabInfo {
    MyLog(@"   Delegate received tab switch. Sending full details for new tab state (Owner: %@, Title: %@, URL: %@)", 
          newTabInfo[@"ownerName"], 
          newTabInfo[@"title"],
          newTabInfo[@"url"]);
    [self sendWindowInfoToJS:newTabInfo withReason:@"chrome_tab_switch"];
}

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