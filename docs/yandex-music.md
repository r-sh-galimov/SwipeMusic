# Яндекс Музыка

## Статус интеграции: вариант A (stub)

Официального публичного API для сторонних приложений **нет**.

| Функция | Статус |
|---------|--------|
| OAuth / Connect | Недоступно официально |
| SearchProvider | Не регистрируется |
| LibraryProvider | Не регистрируется |
| Playback / stream | Кандидаты `available: false` |
| Неофициальный API | Не подключён |

Код: `src/sources/adapters/yandex-music/`.

На `/sources` панель строится только через `AuthenticationProvider.getStatus()`.

В DEV: `Dev · Yandex Music Log`.
