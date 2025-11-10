# Refactoring Summary

## Tujuan
Memisahkan logic dari UI components agar mudah di-maintain dan di-test.

## Struktur Baru

### 1. Custom Hooks (`hooks/`)
- **`useReferencePose.ts`**: Mengelola loading reference pose dari localStorage
- **`useScoreLock.ts`**: Mengelola score locking mechanism untuk mencegah score berubah setelah pertama kali di-set
- **`usePoseAssessment.ts`**: Handle semua logic pose assessment (normalization, similarity calculation, auto-reset)
- **`usePoseCapture.ts`**: Handle TensorFlow.js initialization dan pose detection logic

### 2. Constants (`constants/`)
- **`assessment.ts`**: Semua magic numbers dan constants (duration, speeds, dimensions)

### 3. Components (UI Only)
- **`MainAssessment.tsx`**: Sekarang hanya fokus pada UI, semua logic menggunakan custom hooks
- **`PoseCapture.tsx`**: Tetap memiliki logic karena kompleks, tapi bisa direfactor lebih lanjut
- **`TimingIndicator.tsx`**: UI component dengan animation logic
- **`ScoreOverlay.tsx`**: Pure UI component
- **`ModelPreview.tsx`**: Pure UI component

## Benefits

1. **Separation of Concerns**: Logic terpisah dari UI
2. **Reusability**: Hooks bisa digunakan di component lain
3. **Testability**: Logic bisa di-test secara terpisah
4. **Maintainability**: Perubahan logic tidak mempengaruhi UI dan sebaliknya
5. **Readability**: Component lebih clean dan mudah dibaca

## Usage Example

```typescript
// Sebelum: Logic bercampur dengan UI
export default function MainAssessment() {
  const [referencePose, setReferencePose] = useState(null);
  useEffect(() => {
    // Complex logic here...
  }, []);
  // ... 200+ lines of mixed logic and UI
}

// Sesudah: Logic di hooks, UI tetap clean
export default function MainAssessment() {
  const referencePose = useReferencePose(); // Simple hook
  const { displayScore, setDisplayScore, clearAll } = useScoreLock();
  const { handlePoseDetected, reset } = usePoseAssessment({...});
  // ... hanya UI rendering
}
```

## Next Steps (Optional)

1. Extract PoseCapture logic ke `usePoseCapture` hook
2. Create unit tests untuk hooks
3. Add TypeScript types untuk better type safety
4. Create Storybook stories untuk UI components


