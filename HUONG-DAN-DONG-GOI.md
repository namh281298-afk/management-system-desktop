# Management System – ứng dụng máy tính (Windows .exe / macOS .dmg)

Ứng dụng là một "vỏ" mở https://hethong.thejungleherbs.com trong cửa sổ riêng. Dữ liệu và các bản cập nhật vẫn ở máy chủ:
mỗi lần bạn đưa bản mới lên hosting, ứng dụng tự dùng bản mới, **không phải cài lại file exe/dmg**.

## Tính năng
- **Tự chạy nền khi bật máy:** lần đầu mở, ứng dụng tự đăng ký khởi động cùng Windows/macOS và mở ẩn (nằm dưới khay hoặc Dock, không bật cửa sổ), vẫn nhận tin nhắn và thông báo. Muốn tắt: chuột phải biểu tượng khay (Windows) / biểu tượng trên thanh menu (macOS) → bỏ chọn *Tự khởi động cùng máy*.
- Cửa sổ riêng với logo, nhớ vị trí và kích thước lần trước.
- Windows: bấm X chỉ thu xuống khay hệ thống (cạnh đồng hồ) để vẫn nhận thông báo; chuột phải biểu tượng khay → Thoát.
- Số tin chưa đọc hiện trên biểu tượng ứng dụng (Dock macOS) và trên chú thích của biểu tượng khay.
- Thông báo trên màn hình khi có tin nhắn / việc mới (khi ứng dụng đang mở hoặc đang nằm dưới khay).
- Mở liên kết ngoài hệ thống bằng trình duyệt mặc định; dán ảnh, kéo thả tệp, tải tệp như trên web.
- Mất mạng → hiện trang báo lỗi và tự thử lại.
- Chỉ mở một cửa sổ; mở lần nữa sẽ đưa cửa sổ cũ lên.

## Cách lấy file cài (không cần cài gì trên máy bạn)
1. Tạo một kho (repository) **riêng tư** trên https://github.com, ví dụ `management-system-desktop`.
2. Tải toàn bộ thư mục này lên kho (nút *Add file → Upload files*, kéo cả thư mục, **nhớ giữ thư mục `.github`**).
3. Vào tab **Actions** → chọn *Build desktop apps* → **Run workflow**. Chờ khoảng 5–8 phút.
4. Mở lần chạy đã xong → mục **Artifacts** ở cuối trang:
   - `management-system-windows-latest` → file `…-win-x64.exe` (bộ cài) và bản chạy ngay (portable).
   - `management-system-macos-latest` → hai file `.dmg`: `arm64` cho máy Mac chip Apple (M1/M2/M3/M4, Mac mini mới), `x64` cho Mac Intel.

## Cài đặt trên máy nhân viên
**Windows:** chạy file `.exe`. Nếu hiện "Windows đã bảo vệ PC của bạn" → bấm *Thông tin thêm* → *Vẫn chạy*.
(Cảnh báo này xuất hiện vì file chưa có chứng chỉ ký số trả phí.)

**macOS:** mở file `.dmg`, kéo *Management System* vào *Applications*. Lần đầu mở nếu bị chặn:
- Bấm chuột phải vào ứng dụng → *Mở* → *Mở*; hoặc
- *Cài đặt hệ thống → Quyền riêng tư & Bảo mật* → kéo xuống bấm *Vẫn mở*; hoặc
- Mở Terminal gõ: `xattr -cr "/Applications/Management System.app"`

Lần đầu bấm cho phép **Thông báo** khi hệ thống hỏi.

## Tự build trên máy (tuỳ chọn)
Cần cài Node.js 20+. Trong thư mục này:
```
npm install
npm run build:win     # chạy trên Windows → dist/*.exe
npm run build:mac     # chạy trên macOS  → dist/*.dmg
npm start             # chạy thử không đóng gói
```

## Đổi địa chỉ hệ thống / tên ứng dụng
Sửa file `app-config.json` (`url`, `title`) rồi build lại.

## Giới hạn cần biết
- Thông báo đẩy (Web Push) khi **đóng hẳn** ứng dụng không hoạt động trong ứng dụng desktop. Hãy để ứng dụng chạy nền
  (Windows: nằm dưới khay; macOS: để mở trong Dock) hoặc cài thêm app qua Chrome nếu cần nhận thông báo khi tắt.
- Muốn bỏ cảnh báo bảo mật: ký số bằng Apple Developer (~99 USD/năm) và chứng chỉ ký mã cho Windows.
