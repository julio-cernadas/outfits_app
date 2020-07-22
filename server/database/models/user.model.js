import mongoose from "mongoose";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: "Name is required",
    },
    email: {
        type: String,
        trim: true,
        unique: "Email already exists",
        match: [/.+\@.+\..+/, "Please fill a valid email address"],
        required: "Email is required",
    },
    hashed_password: {
        type: String,
        required: "Password is required",
    },
    salt: String,
    updated: Date,
    created: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.methods = {
    // Salts are used to safeguard passwords in storage, they are random values
    makeSalt: function () {
        return Math.round(new Date().valueOf() * Math.random()) + "";
    },
    encryptPassword: function (password) {
        if (!password) return "";
        try {
            return crypto
                .createHmac("sha1", this.salt)
                .update(password)
                .digest("hex");
        } catch (err) {
            return "";
        }
    },
    // Used in 'auth.controller.js' to authenticate the password for signin!
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },
};

// Virtual means that the property wont be persisted to the db, instead you'll
// store another value and have a get, for when accessing, and set, for when creating.
// NOTE: we never actually set 'salt' or 'hashed_password' ourselves, instead when we
// provide the User object a 'password' in the json object, it automatically run this
// process to setup the other 2 static model properties.
UserSchema.virtual("password")
    .set(function (password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

// Same as adding validation to the User schema defintion above...
UserSchema.path("hashed_password").validate(function (v) {
    if (this._password && this._password.length < 6) {
        this.invalidate("password", "Password must be at least 6 characters.");
    }
    if (this.isNew && !this._password) {
        this.invalidate("password", "Password is required");
    }
}, null);

export default mongoose.model("User", UserSchema);
