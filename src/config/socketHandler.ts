import { Server } from "socket.io";
import "socket.io";

declare module "socket.io" {
    interface Socket {
        chatRooms: Set<string>;
        groupRooms: Set<string>;
        userId: string;
    }
}


export const socketHandler = (io: Server | null) => {
    if (!io) return;

    io.on("connection", (socket) => {
        socket.chatRooms = new Set();
        socket.groupRooms = new Set();

        const userRoom = (id: string): string => id.toString();

        console.log("User connected", socket.id);

        // -----------------------
        // Joining and leaving the fastTravel app
        // -----------------------
        socket.on("join_fastTravel_room", (userId: string) => {
            if (!userId || socket.userId === userId) return;

            socket.userId = userId;

            socket.join(userId.toString());
            socket.join('fastTravel_global_room');

            socket.to('fastTravel_global_room').emit('user_joined', userId);
            console.log('User joined room', userId.toString());
        })

        socket.on('leave_fastTravel_room', () => {
            if (!socket.userId) return;

            // Leave group room;
            socket.groupRooms.forEach((room) => {
                socket.leave(room);
                socket.to(room).emit("group_user_left", socket.userId);
            })
            socket.groupRooms.clear();

            // Leave chat room;
            socket.chatRooms.forEach((room) => {
                socket.leave(room);
                socket.to(room).emit("chat_user_left", socket.userId);
            })
            socket.chatRooms.clear();

            socket.to('fastTravel_global_room').emit('user_left', socket.userId);

            socket.leave(userRoom(socket.userId));
            socket.leave('fastTravel_global_room');
        })

        // -----------------------
        // Groub membership
        // -----------------------
        socket.on("join_group_room", (groupId) => {
            if (!groupId || !socket.userId) return;

            const room = `group_${groupId}`;

            if (socket.groupRooms.has(room)) return;

            socket.join(room);
            socket.groupRooms.add(room);

            socket.to(room).emit("group_user_joined", {
                userId: socket.userId,
                groupId,
            });

            console.log("User joined group room:", room);
        });

        socket.on("leave_group_room", (groupId) => {
            if (!groupId || !socket.userId) return;

            const room = `group_${groupId}`;

            if (!socket.groupRooms.has(room)) return;

            socket.leave(room);
            socket.groupRooms.delete(room);

            socket.to(room).emit("group_user_left", {
                userId: socket.userId,
                groupId,
            });

            console.log("User left group room:", room);
        });

        // -----------------------
        // Chat room
        // -----------------------
        socket.on("join_chat_room", (chatId) => {
            if (!chatId || !socket.userId) return;

            const room = `chat_${chatId.toString()}`;

            // Prevent duplicate joins
            if (socket.rooms.has(room)) return;

            socket.join(room);
            socket.chatRooms.add(room);

            // Notify others only
            socket.to(room).emit("chat_user_joined", {
                userId: socket.userId,
                chatId,
            });

            console.log("User joined chat room:", room);
        });

        socket.on("leave_chat_room", (chatId) => {
            if (!socket.userId || !chatId) return;

            // Ensure chatRooms exists
            socket.chatRooms = socket.chatRooms || new Set();

            const room = `chat_${chatId.toString()}`;

            // Idempotent: do nothing if not joined
            if (!socket.chatRooms.has(room)) return;

            socket.leave(room);
            socket.chatRooms.delete(room);

            // Notify others in the room
            socket.to(room).emit("chat_user_left", {
                userId: socket.userId,
                chatId,
            });

            console.log("User left chat room:", room);
        });

        // -----------------------
        // TYPING EVENTS
        // -----------------------
        socket.on("typing", ({ room }) => {
            if (!room || !socket.userId) return;

            if (!socket.rooms.has(room)) return;

            socket.to(room).emit("user_typing", {
                userId: socket.userId,
            });
        });

        socket.on("not_typing", ({ room }) => {
            if (!room || !socket.userId) return;

            if (!socket.rooms.has(room)) return;

            socket.to(room).emit("user_not_typing", {
                userId: socket.userId,
            });
        });

        // -----------------------
        // DISCONNECT CLEANUP
        // -----------------------
        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);

            if (!socket.userId) return;

            // ---- Group cleanup
            socket.groupRooms?.forEach((room) => {
                socket.leave(room);
                socket.to(room).emit("group_user_left", socket.userId);
            });
            socket.groupRooms?.clear();

            // ---- Chat cleanup
            socket.chatRooms?.forEach((room) => socket.leave(room));
            socket.chatRooms?.clear();

            // ---- LASOP cleanup
            io.to("fastTravel_global_room").emit(
                "user_disconnected",
                socket.userId
            );
        });
    });
}