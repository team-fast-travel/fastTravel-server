import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors, { type CorsOptions } from "cors";
import morgan from "morgan";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import { type MsgFetchParams, type MsgDeleteParams, type GrpFetchParams, type GrpDeleteParams, type BookEditParams, type RideEditParams, type AddressEditParams, type CardEditParams, type NotificationEditParams, type ReviewEditParams, type UserEditParams, type VehicleEditParams } from "./interface/interface.js";

import { connection } from "./config/connection.js";
import { authToken } from "./middleware/authToken.js";

// Chat Routes
import { createMsg } from "./routes/chats/message/createMsg.js";
import { deleteMsgBtwSenders } from "./routes/chats/message/deleteMsgBtwSenders.js";
import { fetchMsgBtwSenders } from "./routes/chats/message/fetchMsgBtwSenders.js";
import { fetchAllMsgsForSender } from "./routes/chats/message/fetchAllMsgsForSender.js";
import { markChatRead } from "./routes/chats/message/markChatRead.js";

// Group Chat Routes
import { sendGroupMsg } from "./routes/chats/groupChat/sendGroupMsg.js";
import { fetchGroupMsg } from "./routes/chats/groupChat/fetchGroupMsg.js";
import { deleteGroupMsg } from "./routes/chats/groupChat/deleteGroupMsg.js";

// Group Routes
import { createGroup } from "./routes/chats/group/createGroup.js";
import { fetchAllGroupByAdmin } from "./routes/chats/group/fetchAllGroupByAdmin.js";
import { editGroupByAdmin } from "./routes/chats/group/editGroupByAdmin.js";
import { deleteGroupByAdmin } from "./routes/chats/group/deleteGroupByAdmin.js";
import { addMemberToGroup } from "./routes/chats/group/addMemberToGroup.js";
import { leaveGroup } from "./routes/chats/group/leaveGroup.js";

// Book Ride Routes
import { createBooking } from "./routes/ride/bookingRide/createBooking.js";
import { fetchBookingByRider } from "./routes/ride/bookingRide/fetchBookingByRider.js";
import { editBookingByRider } from "./routes/ride/bookingRide/editBookingByRider.js";
import { cancelBooking } from "./routes/ride/bookingRide/cancelBooking.js";

// Ride Listing Routes
import { createRide } from "./routes/ride/rideListing/createRide.js";
import { fetchRidesByDriver } from "./routes/ride/rideListing/fetchRidesByDriver.js";
import { fetchAllRides } from "./routes/ride/rideListing/fetchAllRides.js";
import { editRideByDriver } from "./routes/ride/rideListing/editRideByDriver.js";
import { deleteRideByDriver } from "./routes/ride/rideListing/deleteRideByDriver.js";

// Address Routes
import { createAddress } from "./routes/users/address/createAddress.js";
import { fetchAddressByUser } from "./routes/users/address/fetchAddressByUser.js";
import { editAddressByUser } from "./routes/users/address/editAddressByUser.js";
import { deleteAddressByUser } from "./routes/users/address/deleteAddressByUser.js";

// Card Routes
import { createCard } from "./routes/users/cards/createCard.js";
import { fetchCardByUser } from "./routes/users/cards/fetchCardByUser.js";
import { editCardByUser } from "./routes/users/cards/editCardByUser.js";
import { deleteCardByUser } from "./routes/users/cards/deleteCardByUser.js";

// Notification Routes
import { createNotification } from "./routes/users/notification/createNotification.js";
import { fetchUserNotification } from "./routes/users/notification/fetchUserNotification.js";
import { deleteUserNotification } from "./routes/users/notification/deleteUserNotification.js";
import { markNotificationRead } from "./routes/users/notification/markNotificationRead.js";
import { markAllNotificationsAsRead } from "./routes/users/notification/markAllNotificationRead.js";

// Review Routes
import { createReview } from "./routes/users/reviews/createReview.js";
import { fetchUserReviews } from "./routes/users/reviews/fetchUserReview.js";

// Users
import { login } from "./routes/users/logUser/login.js";
import { register } from "./routes/users/user/register.js";
import { fetchUser } from "./routes/users/user/fetchUser.js";
import { editUser } from "./routes/users/user/editUser.js";
import { deleteUser } from "./routes/users/user/deleteUser.js";

// Change/Forget Password, Send Verification code and Verify Email
import { changePassword } from "./routes/users/logUser/changePassword.js";
import { forgetPassword } from "./routes/users/logUser/forgetPassword.js";
import { sendVerificationCode } from "./routes/users/logUser/sendVerificationCode.js";
import { verifyEmail } from "./routes/users/logUser/verifyEmail.js";

// Vehicles
import { createVehicleByUser, uploadVehicleImage } from "./routes/vehicles/createVehicleByUser.js";
import { fetchVehicleById } from "./routes/vehicles/fetchVehicleById.js";
import { fetchVehicleByUser } from "./routes/vehicles/fetchVehicleByUser.js";
import { editVehicleByUser } from "./routes/vehicles/editVehicleByUser.js";
import { deleteVehicleByUser } from "./routes/vehicles/deleteVehicleByUser.js";

// Search rides
import { searchRides } from "./routes/ride/searchRide/searchRides.js";

// Profile
import { createProfile, uploadProfileImage } from "./routes/users/profile/createProfile.js";
import { deleteProfile } from "./routes/users/profile/deleteProfile.js";

// Preferences
import { createPreference } from "./routes/users/preferences/createPreference.js";
import { fetchUserPreference } from "./routes/users/preferences/fetchUserPreference.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------------
// CHATS
// --------------------
app.post('/create_msg', authToken, createMsg);
app.get<MsgFetchParams>('/get_msg/:senderId/:receiverId', authToken, fetchMsgBtwSenders);
app.get('/chats/list', authToken, fetchAllMsgsForSender);
app.put('/mark_chat_read/:receiverId', authToken, markChatRead);
app.delete<MsgDeleteParams>('/delete_msg/:messageId/:otherUserId', authToken, deleteMsgBtwSenders);

// --------------------
// GROUP CHATS
// --------------------
app.post('/send_group_msg', authToken, sendGroupMsg);
app.get<GrpFetchParams>('/get_msg/:groupId/', authToken, fetchGroupMsg);
app.delete<GrpDeleteParams>('/delete_msg/:messageId/:groupId', authToken, deleteGroupMsg);

// --------------------
// GROUPS
// --------------------
app.post('/create_group', authToken, createGroup);
app.get('/fetch_grp', authToken, fetchAllGroupByAdmin);
app.put<GrpFetchParams>('/edit_grp/:groupId', authToken, editGroupByAdmin);
app.delete<GrpFetchParams>('del_grp/:groupId', authToken, deleteGroupByAdmin);
app.put('/add_member', authToken, addMemberToGroup);
app.put<GrpFetchParams>('leave_grp/:groupId', authToken, leaveGroup);

// --------------------
// BOOK RIDE
// --------------------
app.post('/create_booking', authToken, createBooking);
app.get('/fetch_booking', authToken, fetchBookingByRider);
app.put<BookEditParams>('/edit_booking/:bookId', authToken, editBookingByRider);
app.delete<BookEditParams>('/cancel_booking/:bookId', authToken, cancelBooking);

// --------------------
// RIDE LISTING
// --------------------
app.post('/create_ride', authToken, createRide);
app.get('/fetch_ride', authToken, fetchRidesByDriver);
app.get('/fetch_all_ride', authToken, fetchAllRides);
app.put<RideEditParams>('/edit_ride/:rideId', authToken, editRideByDriver);
app.delete<RideEditParams>('/delete_ride/:rideId', authToken, deleteRideByDriver);

// --------------------
// ADDRESS
// --------------------
app.post('/create_address', authToken, createAddress);
app.get('/fetch_address', authToken, fetchAddressByUser);
app.put<AddressEditParams>('/edit_address/:addressId', authToken, editAddressByUser);
app.delete<AddressEditParams>('/delete_address/:addressId', authToken, deleteAddressByUser);

// --------------------
// CARD
// --------------------
app.post('/create_card', authToken, createCard);
app.get('/fetch_card', authToken, fetchCardByUser);
app.put<CardEditParams>('/edit_card/:cardId', authToken, editCardByUser);
app.delete<CardEditParams>('/delete_card/:cardId', authToken, deleteCardByUser);

// --------------------
// NOTIFICATION
// --------------------
app.post('/create_notification', authToken, createNotification);
app.get('/fetch_user_notification', authToken, fetchUserNotification);
app.delete<NotificationEditParams>('/delete_notification/:notificationId', authToken, deleteUserNotification);
app.put<NotificationEditParams>('/mark_notification_read/:notificationId', authToken, markNotificationRead);
app.put('/mark_all_notification_read', authToken, markAllNotificationsAsRead);

// --------------------
// REVIEWS
// --------------------
app.post('/create_review', authToken, createReview);
app.get<ReviewEditParams>('/fetch_user_review/:reviewedId', authToken, fetchUserReviews)

// --------------------
// USER
// --------------------
app.post('/login', login);
app.post('/register', register);
app.get('/fetch_user/:userId', authToken, fetchUser);
app.put<UserEditParams>('/edit_user', authToken, editUser);
app.delete<UserEditParams>('/delete_user', authToken, deleteUser);

// --------------------
// CHANGE AND FORGET PASWORD
// --------------------
app.post('/forget_password', authToken, forgetPassword);
app.put('/change_password', authToken, changePassword);

// --------------------
// SEND VERIFICATION CODE AND VERIFY EMAIL
// --------------------
app.post('/send_verification_code', sendVerificationCode);
app.post('/verify_email', verifyEmail)

// --------------------
// VEHICLE
// --------------------
app.post('/create_vehicle', authToken, uploadVehicleImage, createVehicleByUser);
app.get<VehicleEditParams>('/fetch_vehicle/:vehicleId', authToken, fetchVehicleById);
app.get('/fetch_vehicles_by_user', authToken, fetchVehicleByUser);
app.put<VehicleEditParams>('/edit_vehicle/:vehicleId', authToken, editVehicleByUser);
app.delete<VehicleEditParams>('/delete_vehicle/:vehicleId', authToken, deleteVehicleByUser);

// --------------------
// SEARCH RIDES
// --------------------
app.get('/search_rides', authToken, searchRides);

// --------------------
// PROFILE
// --------------------
app.post('/create_profile', authToken, uploadProfileImage, createProfile);
app.delete('/delete_profile/:profileId', authToken, deleteProfile);

// --------------------
// PREFERENCE
// --------------------
app.post('/create_preference', authToken, createPreference);
app.get('/fetch_preference', authToken, fetchUserPreference);

// start server + DB connection
connection({
  app,
  port: Number(process.env.PORT) || 5000,
});
