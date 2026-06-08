import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, push, set, update, onChildAdded, onChildChanged, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "********************",
    authDomain: "********************",
    databaseURL: "********************",
    projectId: "********************",
    storageBucket: "********************",
    messagingSenderId: "********************",
    appId: "********************"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, "chat2");
const friends = ["Alice", "Bob", "Charlie", "David", "Emily", "Fujii"];
const messages = [];
let currentUser = "";
let selectedFriend = "";
let editingMessageId = "";

function makeRoomId(userName, friendName){
    return [userName, friendName].sort().join("_");
}

function showLoginView(){
    currentUser = "";
    selectedFriend = "";
    $("#friend-name").text("ログインユーザーを選択");
    $("#header-photo").hide();
    $(".back-button").hide();
    $("#login-view").show();
    $("#friends-view").hide();
    $("#message-view").hide();
}

function showFriendsView(){
    selectedFriend = "";
    editingMessageId = "";
    $("#friend-name").text("あなたの友達");
    $("#header-photo").hide();
    $(".back-button").hide();
    $("#login-view").hide();
    $("#friends-view").show();
    $("#message-view").hide();
    $("#text").val("");
    $("#send").text("送信");
}

function showMessageView(friendName){
    selectedFriend = friendName;
    $("#friend-name").text(friendName);
    $("#header-photo").attr("src", `./src/${friendName}.png`);
    $("#header-photo").attr("alt", friendName);
    $("#header-photo").show();
    $(".back-button").show();
    $("#login-view").hide();
    $("#friends-view").hide();
    $("#message-view").show();
    renderMessages();
}

function renderLoginUsers(){
    friends.forEach(function(friendName){
        const h = `
            <button type="button" class="user-button">
                <img class="friend-photo" src="./src/${friendName}.png" alt="${friendName}">
                <span>${friendName}</span>
            </button>
            `;
        $("#login-list").append(h);
    });
}

function renderFriends(){
    $("#friends-list").empty();

    friends.forEach(function(friendName){
        if(friendName === currentUser){
            return;
        }

        const h = `
            <button type="button" class="friend-button">
                <img class="friend-photo" src="./src/${friendName}.png" alt="${friendName}">
                <span>${friendName}</span>
            </button>
            `;
        $("#friends-list").append(h);
    });
}

function renderMessages(){
    $("#output").empty();

    messages.forEach(function(message){
        if(message.roomId === makeRoomId(currentUser, selectedFriend)){
            const messageClass = message.senderName === currentUser ? "own-message" : "";
            const editButton = message.senderName === currentUser ? `<button type="button" class="edit-button" data-id="${message.id}">編集</button>` : "";
            const h =`
                <p class="${messageClass}">
                    <span class="created-at">${message.createdAt || ""}</span><br>
                    <span class="message-row">
                        <span class="sender-name">${message.senderName || ""}</span>
                        <span class="message-text">${message.text}</span>
                        ${editButton}
                    </span>
                </p>
                `;
            $("#output").append(h);
        }
    });

    $("#output").scrollTop($("#output")[0].scrollHeight);
}

renderLoginUsers();
showLoginView();

$("#login-list").on("click", ".user-button", function(){
    currentUser = $(this).find("span").text();
    renderFriends();
    showFriendsView();
});

$("#friends-list").on("click", ".friend-button", function(){
    showMessageView($(this).find("span").text());
});

$(".back-button").on("click", function(){
    showFriendsView();
});

$("#output").on("click", ".edit-button", function(){
    const messageId = $(this).data("id");
    const message = messages.find(function(message){
        return message.id === messageId;
    });

    if(!message || message.senderName !== currentUser){
        return;
    }

    editingMessageId = messageId;
    $("#text").val(message.text).focus();
    $("#send").text("更新");
});

// 送信：送信ボタン押下で名前とメッセージをDBに送信
$("#send").on("click", function(){
    if(editingMessageId){
        update(ref(db, `chat2/${editingMessageId}`), {
            text: $("#text").val()
        });
        editingMessageId = "";
        $("#text").val("").focus();
        $("#send").text("送信");
        return;
    }

    const message = {
        senderName: currentUser,
        friendName: selectedFriend,
        roomId: makeRoomId(currentUser, selectedFriend),
        text: $("#text").val(),
        createdAt: new Date().toLocaleString("ja-JP",{
            month: "numeric",
            day: "numeric",
            weekday : "short",
            hour: "numeric",
            hour12: true,
            minute: "2-digit"
        })
    };

    const newPostRef = push(dbRef);
    set(newPostRef, message);
    $("#text").val("").focus();
});

// 受信：DBからトランザクションを受信して表示
onChildAdded(dbRef, function(data){
    const message = data.val();
    message.id = data.key;
    messages.push(message);
    renderMessages();
});

onChildChanged(dbRef, function(data){
    const updatedMessage = data.val();
    updatedMessage.id = data.key;

    const index = messages.findIndex(function(message){
        return message.id === updatedMessage.id;
    });

    if(index !== -1){
        messages[index] = updatedMessage;
        renderMessages();
    }
});
