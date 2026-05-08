# Guía de Pruebas: Microservicios Backend

Este documento resume la implementación de las pruebas unitarias y de integración para todos los microservicios backend en el proyecto `airbnb_group_services`.

## Resumen

Hemos configurado con éxito una infraestructura de pruebas robusta para los cinco servicios backend:
1. `booking-service`
2. `listing-service`
3. `notification-service`
4. `review-service`
5. `user-service`

## Cambios Realizados

### 1. Directorio Centralizado de Pruebas
Hemos movido todas las pruebas fuera de los directorios individuales de cada servicio hacia una carpeta centralizada `tests/` en la raíz del proyecto. Esto mejora la organización del proyecto y separa el código de pruebas del código de producción.

La nueva estructura se ve así:
```
airbnb_group_services/
├── services/
│   ├── booking-service/
│   ├── listing-service/
│   ├── notification-service/
│   ├── review-service/
│   └── user-service/
└── tests/
    ├── booking-service/
    │   ├── unit/
    │   └── integration/
    ├── listing-service/
    │   ├── unit/
    │   └── integration/
    ├── notification-service/
    │   ├── unit/
    │   └── integration/
    ├── review-service/
    │   ├── unit/
    │   └── integration/
    └── user-service/
        ├── unit/
        └── integration/
```

### 2. Configuración de Jest y TypeScript
Para cada servicio, hemos configurado Jest para que funcione con TypeScript (`ts-jest`):
- Se creó un archivo `jest.config.js` en el directorio de cada servicio apuntando a su correspondiente carpeta en `tests/`.
- Se creó un archivo `tsconfig.json` en cada carpeta `tests/<servicio>` para resolver errores del IDE (como que no se encontrara `process` o `global`).
- Se actualizaron los scripts en `package.json` (`npm run test` y `npm run test:integration`) para ejecutar las pruebas desde las nuevas ubicaciones.

### 3. Pruebas Unitarias
Hemos escrito pruebas unitarias exhaustivas para las funciones principales (handlers) de cada servicio.
- **Mocks**: Utilizamos `jest.mock` para simular dependencias externas como `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-eventbridge` y `uuid`.
- **Cobertura**: Las pruebas cubren escenarios exitosos, errores de validación, accesos no autorizados y errores internos del servidor (por ejemplo, fallos en DynamoDB).
- **Logs de Consola**: Hemos simulado (mocked) `console.error` y `console.log` en las pruebas para mantener limpia la salida de la terminal y suprimir los logs de errores esperados.

### 4. Pruebas de Integración
Hemos escrito pruebas de integración para cada servicio que interactúan con recursos reales de AWS (DynamoDB y EventBridge).
- **Sin Mocks**: Estas pruebas no utilizan ninguna simulación (mock).
- **Seguridad**: Las pruebas incluyen una validación para omitir su ejecución si las variables de entorno requeridas (por ejemplo, `BOOKINGS_TABLE`, `EVENT_BUS_NAME`) no están configuradas. Esto evita que las pruebas fallen cuando se ejecutan en un entorno sin credenciales de AWS configuradas.

## Resultados de Validación

Todas las pruebas unitarias y de integración se han ejecutado y pasan correctamente.

Para ejecutar las pruebas de cualquier servicio, navega al directorio del servicio y ejecuta:
```bash
# Ejecutar pruebas unitarias
npm run test

# Ejecutar pruebas de integración (requiere variables de entorno de AWS)
npm run test:integration
```

También puedes ejecutar todas las pruebas desde el directorio raíz utilizando los workspaces de npm:
```bash
npm run test --workspaces --if-present
```
