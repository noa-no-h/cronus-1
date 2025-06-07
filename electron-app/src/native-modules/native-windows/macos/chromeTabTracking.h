#pragma once
#include <Cocoa/Cocoa.h>

@protocol ChromeTabTrackingDelegate <NSObject>
- (void)chromeTabDidSwitch:(NSDictionary *)newTabInfo;
@end

@interface ChromeTabTracking : NSObject

@property (nonatomic, assign) id<ChromeTabTrackingDelegate> delegate;
@property (nonatomic, retain) NSString *lastKnownChromeURL;
@property (nonatomic, retain) NSString *lastKnownChromeTitle;
@property (nonatomic, assign) BOOL isChromeActive;
@property (nonatomic, retain) NSTimer *chromeTabCheckTimer;

- (id)init;
- (void)dealloc;
- (void)startChromeTabTimer;
- (void)stopChromeTabTimer;
- (void)performChromeTabCheck;
- (NSDictionary*)getCurrentChromeTabBriefInfo;

@end 