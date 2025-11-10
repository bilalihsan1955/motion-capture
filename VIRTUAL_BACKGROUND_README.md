# Virtual Background & Performance Optimization

## Ringkasan Perubahan

Aplikasi motion capture telah diperbarui dengan fitur virtual background dan optimasi performa untuk mendukung perangkat dengan spesifikasi rendah menggunakan Clean Architecture.

## Fitur Baru

### 1. Virtual Background
- **Blur Background**: Mengaburkan latar belakang dengan intensitas yang dapat disesuaikan (5-30px)
- **Custom Image Background**: Mengganti latar belakang dengan gambar custom
- **No Background**: Mode default tanpa virtual background

### 2. Performance Optimization
- **Auto-Detection**: Deteksi otomatis performa perangkat berdasarkan CPU cores dan memory
- **3 Level Performa**:
  - **Rendah**: Untuk perangkat lemah (480x360, 24fps, frame skipping)
  - **Sedang**: Untuk perangkat standar (640x480, 30fps, balanced)
  - **Tinggi**: Untuk perangkat kuat (800x600, 30fps, kualitas maksimal)
- **Frame Skipping**: Mengurangi beban CPU dengan melewati beberapa frame
- **Adaptive Video Resolution**: Resolusi kamera disesuaikan dengan performa device

## Arsitektur (Clean Architecture)

### Separation of Concerns

```
├── hooks/
│   ├── useVirtualBackground.ts      # Business logic virtual background
│   └── [existing hooks...]
├── components/
│   ├── BackgroundSelector.tsx       # UI untuk memilih background
│   ├── PerformanceSettings.tsx      # UI untuk pengaturan performa
│   ├── PengambilanPose.tsx          # Updated: Virtual background integration
│   └── PenilaianUtama.tsx           # Updated: Main page integration
├── lib/
│   └── performanceConfig.ts         # Performance configuration & detection
```

### Layer Architecture

1. **Presentation Layer** (Components)
   - `BackgroundSelector.tsx`: UI untuk memilih dan mengkonfigurasi virtual background
   - `PerformanceSettings.tsx`: UI untuk pengaturan performa
   - `PenilaianUtama.tsx`: Integrasi semua fitur di halaman utama

2. **Business Logic Layer** (Hooks)
   - `useVirtualBackground.ts`: Mengelola segmentasi body dan aplikasi background
   - Isolated dari UI, dapat digunakan di komponen manapun

3. **Configuration Layer** (Lib)
   - `performanceConfig.ts`: Konfigurasi performa terpisah dari business logic
   - Auto-detection device performance
   - Preference storage management

## Cara Menggunakan

### Setup Virtual Background

1. Pilih tipe background di halaman utama:
   - Tidak Ada: Tampilkan video asli
   - Blur: Blur background dengan slider intensitas
   - Gambar: Pilih dari preset background

2. Letakkan gambar background di:
   ```
   public/backgrounds/
   ├── museum1.jpg
   ├── museum2.jpg
   └── gallery.jpg
   ```

### Pengaturan Performa

1. **Auto-Detection**: Aplikasi otomatis mendeteksi performa device
2. **Manual Override**: User dapat memilih level performa secara manual
3. **Preference Saved**: Pilihan user disimpan di localStorage

### Optimasi untuk Low-End Devices

Jika mengalami lag atau frame drop:

1. Pilih **Level Performa: Rendah**
2. Nonaktifkan Virtual Background
3. Aplikasi akan:
   - Menurunkan resolusi video ke 480x360
   - Mengaktifkan frame skipping (skip 2 frames)
   - Menonaktifkan smoothing
   - Membatasi framerate ke 24fps

## Technical Details

### Virtual Background Implementation

```typescript
// Hook usage
const { applyBackground, isReady } = useVirtualBackground({
  type: 'blur',
  blurAmount: 10,
  quality: 'medium'
});

// Apply background in render loop
await applyBackground(videoElement, canvasElement, ctx);
```

### Performance Detection Algorithm

```typescript
// Scoring based on:
// - CPU cores (1-3 points)
// - Device memory (1-3 points)
// - Mobile penalty (-2 points)

Score >= 5: High performance
Score >= 3: Medium performance
Score < 3: Low performance
```

## Dependencies

Dependencies yang sudah ada:
- `@tensorflow-models/body-segmentation`: Body segmentation untuk virtual background
- `@tensorflow/tfjs`: TensorFlow.js runtime
- `@tensorflow-models/pose-detection`: Pose detection (sudah ada)

## Best Practices

### 1. Clean Architecture
- Setiap layer memiliki tanggung jawab yang jelas
- Business logic terpisah dari UI
- Configuration terpisah dari implementation

### 2. Performance
- Frame skipping untuk low-end devices
- Lazy loading untuk models
- Adaptive resolution

### 3. User Experience
- Auto-detection dengan manual override
- Clear visual feedback
- Preference persistence

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Limited (some features may not work)
- Mobile browsers: ⚠️ Limited performance

## Future Improvements

1. **More Background Options**
   - Upload custom background
   - Video backgrounds
   - Green screen mode

2. **Advanced Performance**
   - WebGL acceleration
   - Web Workers for background processing
   - More granular performance tuning

3. **Analytics**
   - Performance metrics tracking
   - Crash reporting
   - Usage analytics

## Troubleshooting

### Virtual Background tidak muncul
- Check browser console untuk errors
- Pastikan camera permission granted
- Coba refresh halaman

### Aplikasi terasa lambat
- Pilih Level Performa: Rendah
- Nonaktifkan Virtual Background
- Close aplikasi lain yang menggunakan camera

### Body segmentation tidak akurat
- Pastikan pencahayaan cukup
- Hindari background yang kompleks
- Tingkatkan kualitas virtual background

## License

Same as main project.
