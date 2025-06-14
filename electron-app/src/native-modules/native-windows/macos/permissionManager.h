#pragma once

#import <Cocoa/Cocoa.h>

typedef NS_ENUM(NSInteger, PermissionType) {
    PermissionTypeAccessibility,
    PermissionTypeAppleEvents
};

typedef NS_ENUM(NSInteger, PermissionStatus) {
    PermissionStatusDenied,
    PermissionStatusGranted,
    PermissionStatusPending
};

@interface PermissionManager : NSObject

/**
 * Singleton instance
 */
+ (instancetype)sharedManager;

/**
 * Controls whether permission dialogs should be shown to users
 * Call this with YES after onboarding is complete
 */
+ (void)setShouldRequestPermissions:(BOOL)shouldRequest;

/**
 * Returns whether permission requests are currently enabled
 */
+ (BOOL)shouldRequestPermissions;

/**
 * Checks if a specific permission is granted
 */
+ (PermissionStatus)statusForPermission:(PermissionType)permissionType;

/**
 * Requests a specific permission with intelligent sequencing
 * This will queue permissions and show them one at a time
 */
+ (void)requestPermission:(PermissionType)permissionType 
               completion:(void(^)(PermissionStatus status))completion;

/**
 * Requests multiple permissions in sequence (not simultaneously)
 */
+ (void)requestPermissions:(NSArray<NSNumber*>*)permissionTypes 
                completion:(void(^)(NSDictionary<NSNumber*, NSNumber*>* results))completion;

/**
 * Check if we have all required permissions for a specific feature
 */
+ (BOOL)hasPermissionsForTitleExtraction;
+ (BOOL)hasPermissionsForContentExtraction;

@end 