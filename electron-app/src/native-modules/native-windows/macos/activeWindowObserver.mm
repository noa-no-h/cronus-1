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
}

- (void) dealloc
{
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [super dealloc];
}

- (id)init {
    self = [super init];
    if (!self) return nil;
    
    [[[NSWorkspace sharedWorkspace] notificationCenter] addObserver:self 
                                                         selector:@selector(receiveAppChangeNotification:) 
                                                             name:NSWorkspaceDidActivateApplicationNotification 
                                                           object:nil];
    
    [self startScreenshotTimer];  // Add this line
    return self;
}

- (void) receiveAppChangeNotification:(NSNotification *) notification
{
    [self removeWindowObserver];

    int currentAppPid = [NSProcessInfo processInfo].processIdentifier;
    NSDictionary<NSString*, NSRunningApplication*> *userInfo = [notification userInfo];
    NSNumber *selectedProcessId = [userInfo valueForKeyPath:@"NSWorkspaceApplicationKey.processIdentifier"];

    if (processId != nil && selectedProcessId.intValue == currentAppPid) {
        return;
    }

    processId = selectedProcessId;

    NSDictionary *details = [self getActiveWindow];
    if (details) {
        NSError *error;
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:details options:0 error:&error];
        if (!jsonData) {
            NSLog(@"Error creating JSON data in receiveAppChangeNotification: %@", error);
        } else {
            NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            std::string* result = new std::string([jsonString UTF8String]);
            activeWindowChangedCallback.BlockingCall(result, napiCallback);
        }
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
        
        // Create base window info
        NSMutableDictionary *windowInfo = [@{
            @"id": windowNumber,
            @"ownerName": windowOwnerName ? windowOwnerName : @"Unknown",
            @"title": windowTitle ? windowTitle : @"",
            @"type": @"window",
            @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
        } mutableCopy];
        
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
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [self removeWindowObserver];
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