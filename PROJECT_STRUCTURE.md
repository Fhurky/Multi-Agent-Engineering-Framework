# Proje Klasör Rehberi

Bu belge, proje ağacındaki klasörlerin sorumluluk sınırlarını tanımlar. Yeni bir dosya mümkün olan en özel klasöre yerleştirilmeli; aynı bilgi birden fazla agent veya araç klasöründe kopyalanmamalıdır.

## Agent organizasyonu

| Klasör | Amaç |
|---|---|
| `.agents/` | Teknolojiden ve LLM sağlayıcısından bağımsız, kanonik agent tanımlarını barındırır. Rol, sistem promptu, kontrol listesi ve çıktı şablonlarının ana kaynağı burasıdır. |
| `.agents/manager/` | Yol haritası, backlog, öncelik ve görev sahipliğini yöneten Project Manager agent’ına ayrılmıştır. Üretim kodu bu klasörün sorumluluğunda değildir. |
| `.agents/architect/` | Mimari kararları, teknik standartları ve bileşen sınırlarını tanımlayan Solution Architect agent’ını içerir. Özellik implementasyonundan önce teknik yönü netleştirir. |
| `.agents/orchestrator/` | İşleri uygun agent’lara yönlendiren, bağımlılıkları ve handoff akışını takip eden koordinasyon agent’ını içerir. Alan uzmanlarının kararlarını devralmaz. |
| `.agents/reviewer/` | Kodu yazan agent’tan bağımsız kod incelemesi yapan reviewer tanımlarını barındırır. Doğruluk, sürdürülebilirlik ve standart uyumunu denetler. |
| `.agents/backend/` | API, servis, iş kuralları ve sunucu tarafı implementasyonundan sorumlu Backend Engineer agent’ını içerir. Kullanıcı arayüzü burada ele alınmaz. |
| `.agents/frontend/` | Kullanıcı arayüzü, erişilebilirlik ve istemci tarafı davranışlarından sorumlu Frontend Engineer agent’ını içerir. Sunucu iş mantığını üstlenmez. |
| `.agents/database/` | Veri modeli, sorgular, migration ve veri bütünlüğünden sorumlu Database Engineer agent’ını içerir. API davranışını doğrudan belirlemez. |
| `.agents/security/` | Tehdit modelleme, secret tarama, SAST ve güvenlik incelemelerini yürüten Security Engineer agent’ını içerir. Yüksek veya kritik bulgularda teslimatı durdurabilir. |
| `.agents/qa/` | Test stratejisi, hata avcılığı ve kabul doğrulamasından sorumlu QA Engineer agent’ını içerir. Üretim mimarisinin sahibi değildir. |
| `.agents/performance/` | Profiling, benchmark ve darboğaz analizinden sorumlu Performance Engineer agent’ını içerir. Optimizasyonları ölçülebilir kanıtlarla değerlendirir. |
| `.agents/devops/` | CI/CD, container, ortam ve dağıtım otomasyonundan sorumlu DevOps Engineer agent’ını içerir. Uygulamanın iş kurallarını sahiplenmez. |
| `.agents/docs/` | Kullanım, API, operasyon ve sürüm dokümantasyonundan sorumlu Documentation Engineer agent’ını içerir. Kod ve davranış değişikliklerinin belgelenmesini sağlar. |

## LLM ve editör adaptörleri

| Klasör | Amaç |
|---|---|
| `.claude/` | Claude’a özgü proje ayarları ve adaptörleri için ayrılmıştır. Kanonik rol kuralları `.agents/` altında kalmalıdır. |
| `.claude/agents/` | Genel agent rollerinin Claude tarafından kullanılacak sağlayıcıya özel karşılıklarını barındırır. Buradaki tanımlar ortak rol sözleşmelerini genişletmeli, kopyalamamalıdır. |
| `.codex/` | Codex’e özgü proje ayarları, otomasyonlar ve adaptörler için ayrılmıştır. Ortak süreçlerin ana kaynağı olarak kullanılmamalıdır. |
| `.codex/skills/` | Codex’in projeye özel, tekrar kullanılabilir skill tanımlarını barındırır. Her skill dar ve açık bir sorumluluğa sahip olmalıdır. |
| `.cursor/` | Cursor editörüne özgü proje ayarlarını barındırır. Uygulama kodundan ve sağlayıcıdan bağımsız kurallardan ayrı tutulur. |
| `.cursor/rules/` | Cursor’un dosya veya bağlam bazlı çalışma kurallarını içerir. Kurallar `.agents/` altındaki sorumluluklarla çelişmemelidir. |

## GitHub iş akışı

| Klasör | Amaç |
|---|---|
| `.github/` | GitHub üzerindeki katkı, inceleme, sahiplik ve otomasyon yapılandırmalarını toplar. Depo yönetimine ait dosyalar burada tutulur. |
| `.github/ISSUE_TEMPLATE/` | Hata, özellik ve görev kayıtlarının tutarlı bilgiyle açılmasını sağlayan issue şablonlarını içerir. Agent’ların ihtiyaç duyduğu kabul kriterleri bu şablonlarla standartlaştırılır. |
| `.github/workflows/` | CI, güvenlik taraması ve sürüm otomasyonu gibi GitHub Actions iş akışlarını içerir. Bir workflow etkinleştirilmeden önce geçerli YAML ve gerekli secret’larla tamamlanmalıdır. |

## Uygulama ve çalışma zamanı

| Klasör | Amaç |
|---|---|
| `src/` | Dağıtılabilir üretim kodunun ana köküdür. Test, rapor ve geçici çıktıların buraya yazılmaması gerekir. |
| `src/agents/` | Uygulama içinde çalışan agent adaptörünü, yürütücülerini ve agent runtime kodunu içerir. Markdown rol sözleşmeleri ise `.agents/` altında kalır. |
| `src/backend/` | API uçları, servisler, sunucu iş mantığı ve backend entegrasyonlarını içerir. Frontend bileşenleri bu klasöre konmaz. |
| `src/frontend/` | Kullanıcı arayüzü bileşenleri, sayfalar ve istemci tarafı durum yönetimini içerir. Sunucuya özel koddan ayrıdır. |
| `src/orchestrator/` | Agent seçimi, iş planlama, paralel çalışma, retry ve sonuç birleştirme gibi orkestrasyon kodunu içerir. Rol talimatlarının değil, çalışma zamanı koordinasyonunun yeridir. |
| `src/shared/` | Birden fazla uygulama bileşeni tarafından kullanılan ortak tip, yardımcı ve sözleşmeleri içerir. Yalnızca gerçekten paylaşılan kod burada tutulmalıdır. |
| `console/` | Agent sistemini gözlemlemek ve yönetmek için geliştirilecek yönetim konsolunun köküdür. Uygulamanın ana iş mantığından ayrı bir arayüz katmanı olarak davranır. |
| `console/client/` | Yönetim konsolunun tarayıcı veya masaüstü istemci arayüzünü içerir. Sunucu endpoint’leri burada tanımlanmaz. |
| `console/server/` | Konsolun backend API’sini, gerçek zamanlı olaylarını ve yönetim servislerini içerir. Ana uygulama backend’iyle sınırları açık tutulmalıdır. |
| `bin/` | Komut satırından çalıştırılacak giriş noktaları ve ince wrapper betikleri için ayrılmıştır. Karmaşık iş mantığı ilgili `src/` veya `scripts/` modülüne yönlendirilmelidir. |

## Yapılandırma ve veri

| Klasör | Amaç |
|---|---|
| `config/` | Secret içermeyen uygulama ve agent yapılandırmalarının ortak köküdür. Hassas değerler environment değişkenleri veya secret yöneticilerinde tutulmalıdır. |
| `config/agents/` | Agent limitleri, model seçimi, yetkiler ve yönlendirme gibi çalıştırma ayarlarını içerir. Rol metinleri yerine makine tarafından okunabilen yapılandırmalar burada bulunur. |
| `config/environments/` | Development, test, staging ve production gibi ortamlara göre değişen, hassas olmayan ayarları içerir. Ortak varsayımlar ile ortam override’ları ayrıştırılmalıdır. |
| `data/` | Örnek, test ve geliştirme verilerinin kontrollü köküdür. Gerçek kullanıcı verisi veya secret içeren üretim çıktıları depoya eklenmemelidir. |
| `data/fixtures/` | Testlerin tekrar üretilebilir başlangıç verilerini barındırır. Fixture’lar küçük, deterministik ve kişisel veriden arındırılmış olmalıdır. |
| `data/samples/` | Dokümantasyon, demo ve yerel denemelerde kullanılan örnek girdileri içerir. Üretim verisinin kopyası olarak kullanılmamalıdır. |
| `schema/` | Veri sözleşmeleri, veritabanı yapısı ve şema evriminin ana köküdür. Uygulama koduyla birlikte sürümlenebilir ve denetlenebilir olmalıdır. |
| `schema/migrations/` | Veritabanı değişikliklerini sırayla ve geri izlenebilir biçimde uygulayan migration dosyalarını içerir. Yayınlanan migration’lar geriye dönük değiştirilmemelidir. |
| `schema/seeds/` | Yerel geliştirme ve test ortamları için başlangıç verisi oluşturan seed dosyalarını içerir. Üretim secret’ları veya hassas veriler burada bulunmamalıdır. |
| `localization/` | Çeviri kaynakları ve yerelleştirme yapılandırmalarının köküdür. Kullanıcıya görünen metinlerin desteklenen dillere göre yönetilmesini sağlar. |
| `localization/locales/` | Her dil veya bölgeye ait çeviri kataloglarını içerir. Anahtarların diller arasında tutarlı tutulması gerekir. |

## Planlama, görev ve handoff akışı

| Klasör | Amaç |
|---|---|
| `plans/` | Yol haritasından türeyen çalışma planlarının, sprintlerin ve sürüm planlarının geçmişini tutar. Uygulama ayrıntısından çok kapsam, sıra ve bağımlılıklara odaklanır. |
| `plans/backlog/` | Henüz sprint veya sürüme alınmamış planlanabilir iş kümelerini içerir. Önceliklendirme Project Manager sorumluluğundadır. |
| `plans/sprints/` | Aktif ve geçmiş sprint planlarını, hedeflerini ve kapasite kararlarını içerir. Her sprint ölçülebilir bir sonuç tanımlamalıdır. |
| `plans/releases/` | Sürümlerin kapsamını, bağımlılıklarını, risklerini ve yayın sırasını tanımlar. İlgili release raporlarına bağlantı vermelidir. |
| `tasks/` | Agent’lar arasında devredilen atomik iş kayıtlarının durum tabanlı köküdür. Her görev tek bir aktif sahibin yanı sıra açık kabul kriterlerine sahip olmalıdır. |
| `tasks/backlog/` | Henüz önceliklendirilmemiş veya detaylandırılmamış görevleri içerir. Çalışmaya başlamadan önce hazır kriterlerini karşılamaları gerekir. |
| `tasks/ready/` | Bağımlılıkları ve kabul kriterleri tamamlanmış, bir agent’a atanabilir görevleri içerir. Buradaki işler uygulamaya başlanabilecek netlikte olmalıdır. |
| `tasks/in-progress/` | Şu anda bir agent tarafından yürütülen görevleri içerir. Görev kaydında sahip, dal ve güncel ilerleme bilgisi bulunmalıdır. |
| `tasks/review/` | Implementasyonu bitmiş ve bağımsız inceleme bekleyen görevleri içerir. Yazar kendi işini onaylayamaz. |
| `tasks/blocked/` | Dış bağımlılık, karar veya teknik engel nedeniyle ilerleyemeyen görevleri içerir. Engel nedeni ve çözülme koşulu açıkça kaydedilmelidir. |
| `tasks/done/` | Kabul kriterleri, inceleme ve gerekli kontrolleri tamamlanan görevlerin arşividir. Sonuç ve ilgili commit veya pull request bağlantısı korunmalıdır. |
| `templates/` | Görev, özellik, ADR, handoff, inceleme ve sürüm belgeleri için tekrar kullanılabilir Markdown şablonlarını içerir. Şablonlar süreç boyunca gerekli bilgilerin unutulmasını önler. |

## Prompt, kontrol listesi ve kalite raporları

| Klasör | Amaç |
|---|---|
| `prompts/` | Belirli iş türlerinde tekrar kullanılacak, sağlayıcıdan bağımsız prompt parçalarının köküdür. Kalıcı rol tanımları `.agents/` altında tutulmalıdır. |
| `prompts/shared/` | Birden fazla rol veya görev tarafından kullanılan ortak talimat bloklarını içerir. Tekrarlı ve zamanla ayrışabilecek prompt kopyalarını azaltır. |
| `prompts/tasks/` | Analiz, implementasyon, migration veya hata düzeltme gibi görev tiplerine özel prompt şablonlarını içerir. Rol yetkilerini genişletmemelidir. |
| `prompts/reviews/` | Kod, güvenlik, QA ve performans incelemelerinde kullanılacak değerlendirme promptlarını içerir. Bulguların tutarlı formatta üretilmesini destekler. |
| `checklist/` | Proje kurulumu, geliştirme, inceleme, güvenlik ve yayın aşamalarındaki zorunlu kontrolleri toplar. Agent bazlı listelerden farklı olarak süreç aşamasını standartlaştırır. |
| `reports/` | İnceleme hattında üretilen tarihsel ve sürüme bağlı raporların köküdür. Kök dizindeki özet teslimat dosyaları gerektiğinde buradaki ayrıntılı raporlara bağlanır. |
| `reports/code-review/` | Bağımsız kod incelemesi bulgularını ve çözüm durumlarını içerir. Her bulgu önem derecesi ve ilgili kod konumuyla izlenebilir olmalıdır. |
| `reports/security/` | Güvenlik taramaları, tehdit değerlendirmeleri ve risk kabul kayıtlarını içerir. Hassas tarama çıktıları veya secret değerleri depoya yazılmamalıdır. |
| `reports/qa/` | Test yürütme sonuçlarını, hata özetlerini ve kabul kanıtlarını içerir. Otomatik üretilen büyük artefaktlar yerine kalıcı özetler saklanmalıdır. |
| `reports/performance/` | Benchmark, profil ve optimizasyon karşılaştırmalarını içerir. Sonuçların ortam, veri seti ve ölçüm yöntemiyle birlikte kaydedilmesi gerekir. |
| `reports/release/` | Yayın hazırlığı, doğrulama, rollback ve sürüm sonrası gözlem sonuçlarını içerir. Her rapor belirli bir sürümle ilişkilendirilmelidir. |

## Teknik dokümantasyon ve tasarım

| Klasör | Amaç |
|---|---|
| `docs/` | Kullanıcı, geliştirici ve operasyon ekipleri için kalıcı dokümantasyonun ana köküdür. Güncel sistem davranışını yansıtmalı ve kod değişiklikleriyle birlikte güncellenmelidir. |
| `docs/adr/` | Önemli mimari kararları, değerlendirilen alternatifleri ve gerekçeleri kaydeden Architecture Decision Record dosyalarını içerir. Karar değiştiğinde eski kayıt silinmek yerine yeni bir kayıtla geçersiz kılınır. |
| `docs/api/` | API sözleşmeleri, kullanım örnekleri, kimlik doğrulama ve hata davranışlarını açıklar. Otomatik üretilen referans ile insan odaklı rehberler ayrıştırılabilir. |
| `docs/architecture/` | Bileşenler, veri akışları, sınırlar ve teknik prensipler hakkında ayrıntılı mimari belgeleri içerir. Kök `ARCHITECTURE.md` dosyası bu klasöre giriş özeti olarak kullanılabilir. |
| `docs/guides/` | Kurulum, geliştirme ve özellik kullanımı gibi adım adım rehberleri içerir. Hedef okuyucu ve ön koşullar her rehberde belirtilmelidir. |
| `docs/runbooks/` | Operasyon, arıza müdahalesi, geri alma ve kurtarma prosedürlerini içerir. Uygulanabilir komutlar ve doğrulama adımları açık olmalıdır. |
| `diagrams/` | Metin belgelerini destekleyen, mümkünse kaynak formatı sürümlenebilir diyagramların köküdür. Üretilen görseller ile düzenlenebilir kaynaklar birlikte yönetilmelidir. |
| `diagrams/architecture/` | Sistem bağlamı, container, component ve deployment gibi mimari diyagramları içerir. İlgili ADR veya mimari belgeye bağlanmalıdır. |
| `diagrams/workflows/` | Agent handoff, görev durumu, CI/CD ve inceleme sırası gibi süreç diyagramlarını içerir. Süreç değiştiğinde diyagram da güncellenmelidir. |
| `mockups/` | Uygulama veya konsol için erken aşama arayüz taslaklarını içerir. Bunlar nihai ürün davranışının tek kaynağı olarak kabul edilmemelidir. |
| `resources/` | Belgelerde, örneklerde veya geliştirme sırasında kullanılan destekleyici materyallerin köküdür. Lisans ve kaynak bilgileri korunmalıdır. |
| `resources/assets/` | Logo, ikon, görsel ve diğer statik tasarım varlıklarını içerir. Uygulamanın derleme sürecine ait konumdan bağımsız bir kaynak havuzudur. |
| `resources/references/` | Dış standartlar, araştırma notları ve proje kararlarını destekleyen referansları içerir. Telifli içeriklerin tam kopyaları yerine mümkünse kaynak bağlantıları saklanmalıdır. |

## Spesifikasyon ve test

| Klasör | Amaç |
|---|---|
| `specs/` | Implementasyondan önce davranış, kapsam ve kabul kriterlerini tanımlayan spesifikasyonların köküdür. Belgeler çözüm kodundan bağımsız biçimde ne yapılacağını açıklamalıdır. |
| `specs/features/` | Kullanıcı veya ürün özelliklerinin davranışını ve kabul senaryolarını içerir. Her özellik görev ve testlerle izlenebilir olmalıdır. |
| `specs/api/` | Endpoint, istek, yanıt, hata ve uyumluluk sözleşmelerini içerir. Backend ve tüketiciler arasında ortak anlaşma sağlar. |
| `specs/database/` | Veri modeli, bütünlük kuralları, migration gereksinimleri ve saklama politikalarını içerir. Şema değişikliklerinden önce Database Engineer tarafından güncellenir. |
| `specs/security/` | Kimlik doğrulama, yetkilendirme, veri koruma ve tehdit azaltma gereksinimlerini içerir. Güvenlik testleri bu gereksinimlere bağlanmalıdır. |
| `specs/testing/` | Test seviyelerini, ortamları, veri stratejisini ve kalite eşiklerini tanımlar. QA uygulamasının ortak sözleşmesidir. |
| `tests/` | Otomatik test kodunun ve test destek materyallerinin ana köküdür. Üretim kodunun klasör yapısıyla makul ölçüde izlenebilir olmalıdır. |
| `tests/unit/` | Tek bir fonksiyon, sınıf veya modülün izole davranışını doğrulayan hızlı testleri içerir. Ağ ve gerçek veritabanı gibi dış bağımlılıklar kullanılmamalıdır. |
| `tests/integration/` | Birden fazla bileşen veya dış servis adaptörü arasındaki sözleşmeyi doğrulayan testleri içerir. Gerekli bağımlılıklar kontrollü ve tekrar üretilebilir olmalıdır. |
| `tests/e2e/` | Sistemin kullanıcıya görünen kritik akışlarını uçtan uca doğrulayan testleri içerir. Sayıca sınırlı, kararlı ve yüksek değerli senaryolara odaklanır. |
| `tests/fixtures/` | Testlerin kullandığı sabit dosya, payload ve beklenen sonuçları içerir. `data/fixtures/` daha genel örnek veri iken burası doğrudan test koduna bağlıdır. |

## Otomasyon ve teslimat

| Klasör | Amaç |
|---|---|
| `scripts/` | Geliştirme, doğrulama ve dağıtım süreçlerinde tekrar kullanılan otomasyonların ana köküdür. Betikler etkileşimsiz çalışabilmeli ve hata durumunda anlamlı exit code üretmelidir. |
| `scripts/setup/` | Yeni bir geliştirme veya CI ortamını hazırlayan kurulum betiklerini içerir. Tekrar çalıştırıldığında güvenli olacak biçimde tasarlanmalıdır. |
| `scripts/development/` | Yerel sunucu başlatma, veri yenileme ve günlük geliştirme yardımcılarını içerir. Üretim dağıtım sorumluluklarından ayrıdır. |
| `scripts/ci/` | CI sağlayıcısından bağımsız doğrulama ve build komutlarını içerir. `.github/workflows/` mümkün olduğunca bu betikleri çağırmalıdır. |
| `scripts/quality/` | Lint, format, tip kontrolü ve benzeri kod kalitesi otomasyonlarını içerir. Yerel ve CI davranışının aynı olmasına yardımcı olur. |
| `scripts/security/` | Secret, bağımlılık, container ve statik güvenlik taramalarını çalıştıran betikleri içerir. Bulguları `reports/security/` için uygun çıktılara dönüştürebilir. |
| `scripts/deploy/` | Ortamlara dağıtım ve geri alma işlemlerini yürüten betikleri içerir. Varsayılan davranışın güvenli olması ve hedef ortamın açıkça doğrulanması gerekir. |
| `scripts/release/` | Sürüm numarası, paketleme, changelog ve yayınlama otomasyonlarını içerir. Release planı ve CI kontrolleri tamamlanmadan çalıştırılmamalıdır. |

## Yerel ve üretilen klasörler

| Klasör | Amaç |
|---|---|
| `.git/` | Git’in commit, branch, remote ve index gibi yerel depo metadatasını sakladığı üretilen klasördür. Elle düzenlenmemeli ve hiçbir zaman commit içine dahil edilmemelidir. |
| `node_modules/` | Node.js bağımlılıklarının paket yöneticisi tarafından oluşturulan yerel klasördür. Kaynak yapının parçası değildir ve Git’e eklenmemelidir. |

