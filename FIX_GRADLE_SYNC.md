# Android Gradle Sync Hatası — Hızlı Çözüm

## Neden oluyor?

`android/capacitor.settings.gradle` şu yolları içerir:

```
../node_modules/@capacitor/android/capacitor
../node_modules/@capacitor/splash-screen/android
```

Bu yollar **proje kökündeki `node_modules` klasörüne** bağımlıdır. GitHub'dan klonladıktan sonra `node_modules` yoktur — bu yüzden Android Studio `android/` klasörünü açtığında Gradle hemen `Project ':capacitor-android' not found` ya da `cordova.variables.gradle not found` gibi hatalar verir.

## Çözüm (sırayla, proje kökünde çalıştır)

```bash
# 1. Bağımlılıkları kur (node_modules üretir)
npm install

# 2. Web build üret (dist/client klasörünü ve index.html dosyasını oluşturur)
npm run build

# 3. Capacitor sync — node_modules'ten gradle yollarını yeniden bağlar
#    ve dist/ içeriğini android/app/src/main/assets/public/ altına kopyalar
npx cap sync android

# 4. Şimdi Android Studio'da aç
npx cap open android
```

İlk açılışta Gradle birkaç dakika dependency indirir. Bittikten sonra:
- **Build → Make Project** → hata olmamalı.
- **Build → Build Bundle(s) / APK(s) → Build APK(s)** → debug APK üretir.

## Hala hata alıyorsan

### "SDK location not found"
`android/local.properties` yok. Android Studio'da projeyi açtığında otomatik üretir. Manuel:
```properties
sdk.dir=/Users/KULLANICI/Library/Android/sdk          # macOS
sdk.dir=C\:\\Users\\KULLANICI\\AppData\\Local\\Android\\Sdk  # Windows
```

### "JAVA_HOME is not set" / "Unsupported class file major version"
JDK 21 gerekli (Capacitor 7 + AGP 8.13 ile). Android Studio → **Settings → Build Tools → Gradle → Gradle JDK** → `Embedded JDK 21` seç.

### "Failed to resolve org.apache.cordova:framework"
İnternet bağlantısı veya proxy/firewall maven central'a erişimi engelliyor. Şirket ağındaysan VPN dene.

### `dist/client/` boş veya `index.html` yok
Mobil statik build çıktısı doğru üretilmemiş demektir. `npm run build` çıktısını kontrol et; `dist/client/index.html` dosyası olmalı. Sadece mobil çıktıyı yenilemek için `npm run build:mobile` çalıştırabilirsin — Capacitor düz statik dosyalara ihtiyaç duyar.

### Her şeyi sıfırla
```bash
rm -rf node_modules android/.gradle android/app/build android/build
npm install
npm run build
npx cap sync android
```

## Önemli notlar

- `android/` klasörünü asla `node_modules` olmadan açma.
- `npx cap sync android` her web değişikliğinden sonra (build sonrası) çalıştırılmalı.
- `capacitor.config.ts` değişirse de `cap sync` gerekli.
- Hesaplama / kayıt sistemine dokunulmadı — Capacitor sadece web app'i WebView'da çalıştırır, `localStorage` Android'de de aynı şekilde kalıcı çalışır.
