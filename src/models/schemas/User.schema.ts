import { ObjectId } from "mongodb"
import { UserVerifyStatus } from "~/constants/enum"


interface UserType {
  _id?: ObjectId

  // Đăng kí: username, email, date of birth, password
  // Đăng nhập: email và password
  name: string
  username?: string
  email: string
  date_of_birth: Date
  password: string
  location?: string

  // Xác thực email: jwt nếu chưa xác thực, '' khi đã xác thực
  email_verify_token?: string

  // Quên mật khẩu: jwt nếu chưa xác thực, '' khi đã xác thực
  forgot_password_token?: string

  // Thông tin người dùng có thể cập nhật thêm
  bio?: string
  avatar?: string
  cover_photo?: string

  // Quản lý trạng thái tài khoản
  verify?: UserVerifyStatus

  // Danh sach id cua nhung nguoi user nay add vao circle
  tweeter_circle?: ObjectId[]

  // Quản lý thời gian tạo và cập nhập tài khoản
  created_at?: Date
  updated_at?: Date
}
export default class User {
  _id?: ObjectId;
  username?: string;
  name: string;
  email: string;
  date_of_birth: Date;
  password: string;
  email_verify_token: string;
  forgot_password_token: string;
  bio: string;
  avatar: string;
  cover_photo: string;
  verify: UserVerifyStatus;
  tweeter_circle: ObjectId[]
  created_at: Date;
  updated_at: Date
  location: string

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.avatar = user.avatar || ""
    this.bio = user.bio || ""
    this.cover_photo = user.cover_photo || ""
    this.created_at = user.created_at || date
    this.date_of_birth = user.date_of_birth || new Date()
    this.email = user.email
    this.email_verify_token = user.email_verify_token || ""
    this.forgot_password_token = user.forgot_password_token || ""
    this.password = user.password
    this.updated_at = user.updated_at || date
    this.username = user.username || ""
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.location = user.location || ""
    this.name = user.name
    this.tweeter_circle = user.tweeter_circle || []
  }
}