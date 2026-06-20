# Capacitor Assets

Bu klasör `@capacitor/assets` ile Android ikon ve splash görsellerini üretmek için kullanılır.

## Kullanım

```bash
npx capacitor-assets generate --android
```

## Gerekli kaynak dosyalar

- `assets/icon.png` — 1024x1024 px, uygulama ikonu
- `assets/icon-foreground.png` — 1024x1024 px, adaptive icon foreground (saydam arka plan)
- `assets/icon-background.png` — 1024x1024 px, adaptive icon background (düz renk önerilir: #0f172a)
- `assets/splash.png` — 2732x2732 px, splash screen (logo ortada, geri kalan #0f172a)
- `assets/splash-dark.png` — 2732x2732 px (opsiyonel, dark mode)

Mevcut `public/icon-512.png` dosyasını 1024'e büyüterek başlangıç olarak kullanabilirsin:

```bash
cp public/icon-512.png assets/icon.png
cp public/icon-512.png assets/splash.png
```
