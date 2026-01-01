import type { ParamsDictionary } from "express-serve-static-core";

// Message interface
export type MsgFetchParams = ParamsDictionary & {
    senderId: string;
    receiverId: string;
}

export type MsgDeleteParams = ParamsDictionary & {
    messageId: string;
    otherUserId: string;
}

// Group interface
export type GrpDeleteParams = ParamsDictionary & {
    messageId: string;
    groupId: string;
}

export type GrpFetchParams = ParamsDictionary & {
    groupId: string;
}

// Book interface
export type BookEditParams = ParamsDictionary & {
    bookId: string;
}

// Ride Listing interface
export type RideEditParams = ParamsDictionary & {
    rideId: string;
}

// Address interface
export type AddressEditParams = ParamsDictionary & {
    addressId: string;
}

// Card interface
export type CardEditParams = ParamsDictionary & {
    cardId: string;
}

// Notification interface
export type NotificationEditParams = ParamsDictionary & {
    notificationId: string;
}

// Notification interface
export type ReviewEditParams = ParamsDictionary & {
    userId: string;
}

// User interface
export type UserEditParams = ParamsDictionary & {
    userId: string;
}

// Vehicle interface
export type VehicleEditParams = ParamsDictionary & {
    vehicleId: string;
}