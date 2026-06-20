# Android Yayın Kılavuzu — Mesai Defteri

Bu kılavuz, mevcut web uygulamasını **Capacitor** ile Android paketine (APK / AAB) dönüştürme adımlarını anlatır. Hesaplama, kayıt sistemi ve localStorage'a dokunulmaz — Capacitor sadece WebView'da uygulamayı çalıştırır, `localStorage` Android'de de aynı şekilde çalışır.

---

## 0. Gereksinimler (bilgisayarında kurulu olmalı)

- **Node.js 18+**
- **Android Studio** (Hedgehog veya üstü) — https://developer.android.com/studio
- **JDK 17** (Android Studio ile birlikte gelir)
- Android SDK + Build Tools (Android Studio kurulumda otomatik indirir)

---

## 1. Projeyi GitHub'a aktar ve klonla

1. Lovable sağ üstten **GitHub → Connect** ile repoyu bağla.
2. Kendi bilgisayarına klonla:
   ```bash
   git clone <repo-url> mesai-defteri
   cd mesai-defteri
   npm install
   ```

---

## 2. Capacitor'ü kur

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Mesai Defteri" "com.mesaidefteri.app" --web-dir=dist/client
```

> `--web-dir=dist/client` TanStack Start istemci/static build çıktısının klasörüdür.

Bu komut proje köküne `capacitor.config.ts` dosyası oluşturur. İçeriği şöyle görünmeli:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mesaidefteri.app',
  appName: 'Mesai Defteri',
  webDir: 'dist/client',
};

export default config;
```

---

## 3. Web uygulamasını build et

```bash
npm run build
```

> Capacitor statik istemci dosyalarını kullanır. Build sonrası `dist/client/index.html` olduğunu doğrula.

Sadece Android/Capacitor için statik SPA çıktısını yenilemek istersen:

```bash
npm run build:mobile
```

---

## 4. Android platformunu ekle

```bash
npx cap add android
npx cap sync android
```

Bu komut proje köküne `android/` klasörü oluşturur (Gradle projesi).

---

## 5. Uygulama ikonlarını ve splash'i yerleştir

Mevcut `public/icon-512.png` dosyasını kullanarak ikonları üret. En kolay yol:

```bash
npm install -D @capacitor/assets
# Kaynak ikon (1024x1024 önerilir):
mkdir -p assets
cp public/icon-512.png assets/icon.png
cp public/icon-512.png assets/splash.png
npx capacitor-assets generate --android
```

Bu komut tüm density (mdpi → xxxhdpi) ikon ve splash görsellerini otomatik üretir.

---

## 6. Android Studio'da aç

```bash
npx cap open android
```

İlk açılışta Gradle sync birkaç dakika sürer. Sync tamamlandıktan sonra:

- Sol panelden `app/build.gradle` aç, `versionCode` ve `versionName` doğrula.
- `AndroidManifest.xml` içinde `android:label="Mesai Defteri"` olduğunu doğrula.

---

## 7. Test için APK üret (debug)

### Android Studio'dan:
1. Üst menü → **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Sağ alttaki bildirimden **locate** linkine tıkla.
3. APK yolu: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Telefonunu USB ile bağla, **Geliştirici Seçenekleri → USB Debugging** açık olsun:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

Ya da APK dosyasını telefona kopyalayıp "Bilinmeyen kaynak" izniyle elle kur.

---

## 8. Google Play için AAB üret (release, imzalı)

### 8.1. İmzalama anahtarı (keystore) oluştur — bir kerelik

```bash
keytool -genkey -v -keystore mesai-defteri.keystore \
  -alias mesai-defteri -keyalg RSA -keysize 2048 -validity 10000
```

Sorulan parolayı **güvenli bir yere kaydet**. Bu keystore kaybolursa uygulamayı bir daha güncelleyemezsin.

### 8.2. `android/key.properties` dosyası oluştur

```properties
storeFile=../../mesai-defteri.keystore
storePassword=BURAYA_PAROLA
keyAlias=mesai-defteri
keyPassword=BURAYA_PAROLA
```

### 8.3. `android/app/build.gradle` üstüne ekle

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 8.4. AAB üret

**Android Studio'dan:**
1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** seç → keystore dosyasını ve parolasını gir
3. **release** variant seç → Finish
4. Çıktı: `android/app/build/outputs/bundle/release/app-release.aab`

**Komut satırından:**
```bash
cd android
./gradlew bundleRelease
```

---

## 9. Google Play Console'a yükle

1. https://play.google.com/console — yeni uygulama oluştur.
2. **Paket adı:** `com.mesaidefteri.app` (bir kez seçilince değişmez).
3. **App Bundle** sekmesinde `app-release.aab` dosyasını yükle.
4. **Mağaza listesi** için `STORE_LISTING.md` içindeki metinleri kullan.
5. **Veri güvenliği** formunda: "Veri toplanmaz, paylaşılmaz" olarak işaretle.
6. İçerik derecelendirmesi anketini doldur (Herkes / Everyone).
7. Test sürümü → Production'a göndermeden önce **Internal testing** ile dene.

---

## 10. Sonraki güncellemeler

Her yeni sürüm için:
1. `android/app/build.gradle` içinde `versionCode` (1 → 2 → 3 …) ve `versionName` (`1.0.0` → `1.0.1`) artır.
2. `npm run build && npx cap sync android` veya tek komutla `npm run cap:sync:android`
3. AAB'yi yeniden üret ve Play Console'a yükle.

---

## Sorun Giderme

- **Beyaz ekran açılışta:** `capacitor.config.ts` içinde `webDir` doğru mu? `dist/client/index.html` var mı?
- **localStorage temizleniyor:** Capacitor WebView'da `localStorage` kalıcıdır. Eğer kullanıcı "Uygulama verisini sil" derse silinir — bu Android'in standart davranışıdır.
- **Gradle sync hatası:** Android Studio → **File → Invalidate Caches / Restart**.
- **`adb` bulunamadı:** `~/Library/Android/sdk/platform-tools` (Mac) veya `%LOCALAPPDATA%\Android\Sdk\platform-tools` (Windows) klasörünü PATH'e ekle.
