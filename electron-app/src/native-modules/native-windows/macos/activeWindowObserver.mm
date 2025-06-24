#import "activeWindowObserver.h"
#import "sleepAndLockObserver.h"
#import "browserTabUtils.h"
#import "chromeTabTracking.h"
#import "contentExtractor.h"
#import "iconUtils.h"
#import "appFilter.h"
#import "titleExtractor.h"
#import "ScreenshotManager.h"
#include <iostream>
#include <stdio.h> // For fprintf, stderr
#include <stdarg.h>
#import <CoreGraphics/CoreGraphics.h>
#import <os/log.h>
#import <ApplicationServices/ApplicationServices.h>
#import <Cocoa/Cocoa.h>
#import <Vision/Vision.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>  

// Custom Log Macro
#define MyLog(format, ...) { \
    static os_log_t log_handle = NULL; \
    if (log_handle == NULL) { \
        log_handle = os_log_create("com.cronus.app", "ActiveWindowObserver"); \
    } \
    NSString *log_message = [NSString stringWithFormat:format, ##__VA_ARGS__]; \
    os_log(log_handle, "%{public}s", [log_message UTF8String]); \
}

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
    ScreenshotManager *screenshotManager;
}

- (id)init {
    self = [super init];
    if (!self) return nil;
    
    sleepAndLockObserver = [[SleepAndLockObserver alloc] initWithWindowObserver:self];
    chromeTabTracking = [[ChromeTabTracking alloc] init];
    chromeTabTracking.delegate = self;
    
    screenshotManager = [[ScreenshotManager alloc] init];
    screenshotManager.delegate = self;
    [screenshotManager startPeriodicScreenshotCapture];
    
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
    [screenshotManager release];
    screenshotManager = nil;

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
    
    // MyLog(@"⏰ PERIODIC TIMER FIRED - Last switch: %.1f seconds ago", timeSinceLastSwitch);
    
    // Always capture periodic backup
    // MyLog(@"📅 PERIODIC BACKUP: Capturing current state");
    
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

    // MyLog(@"[AppSwitch] Notification for app activation: %@ (PID %@)", expectedAppNameBeforeDelay, currentOperationProcessId);

    // After an app activation notification, there can be a slight delay before the system
    // fully updates its window list. Introduce a brief pause here to ensure that when
    // we query for the active window, we get the newly activated app, not the previous one.
    // Introduce a small delay to allow system window state to update
    NSTimeInterval delayInMSec = 100;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInMSec * NSEC_PER_MSEC));
    
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
        // MyLog(@"[AppSwitch] After %.0fms delay, processing for PID %@", delayInMSec, currentOperationProcessId);
        NSDictionary *details = [self getActiveWindow]; // Attempt to get the new active window
        
        if (details) {
            NSString *ownerNameFromDetails = details[@"ownerName"];
            // MyLog(@"[AppSwitch]   Active window found: %@. Expected app: %@.", ownerNameFromDetails, expectedAppNameBeforeDelay);
            
            // Update tracking variables and send data
            self->lastTrackedApp = ownerNameFromDetails;
            [self sendWindowInfoToJS:details withReason:@"app_switch"];
        } else {
            //  MyLog(@"[AppSwitch]   No active window details found after delay for PID: %@", currentOperationProcessId);
        }

        // Setup observer for the new application
        AXUIElementRef appElem = AXUIElementCreateApplication(currentOperationProcessId.intValue);
        if (!appElem) {
            // MyLog(@"[AppSwitch]   Failed to create AXUIElement for PID %@", currentOperationProcessId);
            return;
        }
        
        // self->observer should be Nil here due to [self removeWindowObserver] at the start of receiveAppChangeNotification
        AXError createResult = AXObserverCreate(currentOperationProcessId.intValue, windowChangeCallback, &(self->observer));

        if (createResult != kAXErrorSuccess) {
            // MyLog(@"[AppSwitch]   AXObserverCreate failed for PID %@: Error %d", currentOperationProcessId, createResult);
            CFRelease(appElem); // Release appElem if observer creation fails
            return;
        }

        AXObserverAddNotification(self->observer, appElem, kAXMainWindowChangedNotification, (__bridge void *)(self));
        CFRunLoopAddSource([[NSRunLoop currentRunLoop] getCFRunLoop], AXObserverGetRunLoopSource(self->observer), kCFRunLoopDefaultMode);
        
        CFRelease(appElem); // Release the element as its information has been registered
        // MyLog(@"[AppSwitch]   Observers added for PID %@ (%@)", currentOperationProcessId, expectedAppNameBeforeDelay);
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
            // Add a check to ignore tiling manager windows
            NSString *windowOwnerName = [window objectForKey:(id)kCGWindowOwnerName];
            NSString *windowTitle = [window objectForKey:(id)kCGWindowName];
            if ([windowOwnerName isEqualToString:@"WindowManager"] && [windowTitle isEqualToString:@"Tiling Handle Window"]) {
                MyLog(@"[Filter] Ignoring tiling manager helper window.");
                continue; // This is the helper window, skip it and check the next one.
            }

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
        if (shouldExcludeApp(windowOwnerName, windowTitle)) {
            return nil;
        }
        
        NSString *iconPath = getAppIconPath(windowOwnerName);
        
        // Create base window info
        NSMutableDictionary *windowInfo = [@{
            @"id": windowNumber,
            @"ownerName": windowOwnerName ? windowOwnerName : @"Unknown",
            @"title": windowTitle ? windowTitle : @"",
            @"type": @"window",
            @"icon": iconPath ? iconPath : @"",
            @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
        } mutableCopy];

        // If we don't have a window title, try to get it using our title extractor
        if (!windowTitle || windowTitle.length == 0) {
            NSString *extractedTitle = [TitleExtractor extractWindowTitleForApp:windowOwnerName];
            if (extractedTitle && extractedTitle.length > 0) {
                windowInfo[@"title"] = extractedTitle;
                MyLog(@"   ✅ Title extracted successfully: '%@'", extractedTitle);
            } else {
                MyLog(@"   ⚠️  Could not extract title for app: %@", windowOwnerName);
            }
        }

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
    MyLog(@"🐛 DEBUG: Chrome window detected - about to process");
    
    NSDictionary *chromeInfo = [BrowserTabUtils getChromeTabInfo];
    if (chromeInfo) {
        [windowInfo addEntriesFromDictionary:chromeInfo];

        if (chromeTabTracking.isChromeActive && chromeTabTracking.lastKnownChromeURL == nil && chromeInfo[@"url"]) {
            MyLog(@"[Chrome Tab] Setting initial known tab: URL=%@, Title=%@", chromeInfo[@"url"], chromeInfo[@"title"]);
            chromeTabTracking.lastKnownChromeURL = [chromeInfo[@"url"] copy];
            chromeTabTracking.lastKnownChromeTitle = [chromeInfo[@"title"] copy];
        }
    }
    
    // SYNCHRONOUS OCR - no completion blocks!
    MyLog(@"🐛 DEBUG: About to perform synchronous OCR");
    NSString *ocrContent = [self performSynchronousOCR];
    
    // Add OCR content directly to windowInfo
    windowInfo[@"content"] = ocrContent ?: @"";
    windowInfo[@"contentSource"] = @"ocr";
    windowInfo[@"type"] = @"browser";
    windowInfo[@"browser"] = @"chrome";
    
    MyLog(@"📤 Returning Chrome data with OCR content (%lu chars)", (unsigned long)[ocrContent length]);
    return windowInfo; // Return normally like other apps
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
    [screenshotManager stopPeriodicScreenshotCapture];
    [sleepAndLockObserver stopObserving];
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [self removeWindowObserver];
}

// App exclusion related - REMOVED, see appFilter.mm

- (void)chromeTabDidSwitch:(NSDictionary *)newTabInfo {
    MyLog(@"   Delegate received tab switch. Sending full details for new tab state (Owner: %@, Title: %@, URL: %@)", 
          newTabInfo[@"ownerName"], 
          newTabInfo[@"title"],
          newTabInfo[@"url"]);
    [self sendWindowInfoToJS:newTabInfo withReason:@"chrome_tab_switch"];
}

#pragma mark - ScreenshotManagerDelegate

- (NSDictionary *)getActiveWindowForScreenshotManager:(ScreenshotManager *)manager {
    return [self getActiveWindow];
}

- (void)screenshotManager:(ScreenshotManager *)manager didCaptureScreenshot:(NSString *)filePath forWindowInfo:(NSDictionary *)windowInfo {
    MyLog(@"[Screenshot] Captured screenshot for %@ at path %@", windowInfo[@"ownerName"], filePath);

    NSMutableDictionary *mutableWindowInfo = [windowInfo mutableCopy];
    mutableWindowInfo[@"localScreenshotPath"] = filePath;
    mutableWindowInfo[@"screenshotTimestamp"] = @([[NSDate date] timeIntervalSince1970] * 1000);

    [self sendWindowInfoToJS:mutableWindowInfo withReason:@"screenshot"];

    [mutableWindowInfo release];
}

// OCR Methods for Chrome content extraction
- (NSString*)performSynchronousOCR {
    MyLog(@"🔍 Starting synchronous OCR");
    
    @try {
        // Capture screenshot
        CGImageRef screenshot = CGWindowListCreateImage(CGRectInfinite,
                                                       kCGWindowListOptionOnScreenOnly,
                                                       kCGNullWindowID,
                                                       kCGWindowImageDefault);
        if (!screenshot) {
            MyLog(@"❌ Failed to capture screenshot");
            return @"";
        }
        
        MyLog(@"✅ Screenshot captured successfully");
        
        // Create OCR request
        VNRecognizeTextRequest *request = [[VNRecognizeTextRequest alloc] init];
        if (!request) {
            MyLog(@"❌ Failed to create VNRecognizeTextRequest");
            CFRelease(screenshot);
            return @"";
        }
        
        request.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
        request.usesLanguageCorrection = YES;
        
        MyLog(@"✅ OCR request created and configured");
        
        // Create handler and perform synchronously
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] 
            initWithCGImage:screenshot options:@{}];
        
        if (!handler) {
            MyLog(@"❌ Failed to create VNImageRequestHandler");
            [request release];
            CFRelease(screenshot);
            return @"";
        }
        
        MyLog(@"✅ Image request handler created");
        
        NSError *error = nil;
        NSArray *requestArray = @[request];
        BOOL success = [handler performRequests:requestArray error:&error];
        
        MyLog(@"🔍 OCR performRequests completed: success=%d", success);
        
        NSString *result = @"";
        
        if (success && !error) {
            MyLog(@"✅ OCR successful, processing results");
            NSMutableArray *textSegments = [[NSMutableArray alloc] init];
            
            NSArray *results = request.results;
            MyLog(@"📊 OCR found %lu observations", (unsigned long)[results count]);
            
            for (VNRecognizedTextObservation *observation in results) {
                VNRecognizedText *topCandidate = [observation topCandidates:1].firstObject;
                if (topCandidate && topCandidate.confidence > 0.3) {
                    [textSegments addObject:topCandidate.string];
                }
            }
            
            result = [textSegments componentsJoinedByString:@" "];
            MyLog(@"✅ Synchronous OCR completed: %lu characters extracted", (unsigned long)result.length);
            [textSegments release];
        } else {
            if (error) {
                MyLog(@"❌ OCR failed with error: %@", [error description]);
            } else {
                MyLog(@"❌ OCR failed without error object");
            }
        }
        
        // Clean up
        [request release];
        [handler release];
        CFRelease(screenshot);
        
        return result;
        
    } @catch (NSException *exception) {
        MyLog(@"💥 Exception in performSynchronousOCR: %@", [exception reason]);
        return @"";
    }
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