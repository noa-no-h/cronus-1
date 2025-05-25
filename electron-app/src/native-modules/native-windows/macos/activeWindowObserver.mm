#import "activeWindowObserver.h"
#include <iostream>

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
}

- (void) dealloc
{
    [[[NSWorkspace sharedWorkspace] notificationCenter] removeObserver:self];
    [super dealloc];
}

- (id) init
{
    self = [super init];
    if (!self) return nil;

    [[[NSWorkspace sharedWorkspace] notificationCenter] addObserver:self selector:@selector(receiveAppChangeNotification:) name:NSWorkspaceDidActivateApplicationNotification object:nil];

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
    NSArray *windows = (__bridge_transfer NSArray *)CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID);
    NSDictionary *frontmostWindow = nil;

    for (NSDictionary *window in windows) {
        NSNumber *windowLayer = [window objectForKey:(id)kCGWindowLayer];
        if ([windowLayer intValue] == 0) { // Filter for windows in the normal window layer
            frontmostWindow = window;
            break;
        }
    }

    if (frontmostWindow) {
        NSNumber *windowNumber = [frontmostWindow objectForKey:(id)kCGWindowNumber];
        NSString *windowOwnerName = [frontmostWindow objectForKey:(id)kCGWindowOwnerName];
        // NSLog(@"%@ activeWindow", frontmostWindow); // You can keep this for debugging if you want

        return @{
            @"id": windowNumber,
            @"ownerName": windowOwnerName ? windowOwnerName : @"Unknown" // Provide a default if ownerName is nil
        };
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

- (void) cleanUp
{
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