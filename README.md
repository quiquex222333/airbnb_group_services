# Airbnb Backend Project - Diseño y Modelado de API

Bienvenido al repositorio del diseño backend del proyecto **Airbnb Clone**, desarrollado como parte de la maestría de Desarrollo Full Stack (Cloud Computing y Microservicios).

Este repositorio centraliza toda la concepción arquitectónica inicial (Diseño de Sistemas, Seguridad, Base de Datos) y la definición paramétrica de sus contratos de interfaz (API) empleando ecosistemas _API-First_ modernos.

## 📋 Contenido del Repositorio

El proyecto se estructura en dos enfoques fundamentales que conforman el entregable:

1. **📄 Documento de Arquitectura y Diseño Técnico**
   - **Archivo:** [`Airbnb_Design_Document.md`](./Airbnb_Design_Document.md)
   - Contiene la arquitectura completa basada en microservicios agrupada por componentes críticos:
     - Catálogo y Motor de Búsqueda (Alta Disponibilidad).
     - Reservas y Transaccionalidad (Consistencia Fuerte ACID).
     - Diseño de Seguridad (Flujos OIDC/SSO y Autorización RBAC).
     - Diagramas de secuencias de eventos y diagramas entidad-relación (ER).
     - Estimaciones de capacidad operacional.

2. **🛠️ Definiciones Modeladas de la API REST**
   - **Carpeta:** [`airbnb-smithy/`](./airbnb-smithy/)
   - Aloja el modelo oficial, seguro y fuertemente tipado de nuestra API, diseñado con el lenguaje DSL **AWS Smithy**.
   - Integra las validaciones del servidor (`@range`, `@pattern`, `@length`).
   - Incluye reglas seguras centralizadas (traits de `@httpBearerAuth`).
   - Modela todos los ecosistemas y operaciones REST (Listings, Bookings, Reviews, Errors).

## 🚀 Cómo compilar y trabajar con el Modelo (Smithy)

Para validar, compilar las definiciones de la API u obtener artefactos compatibles como especificaciones OpenAPI (Swagger)/SDKs, es necesario tener [Smithy CLI](https://smithy.io/2.0/guides/building-models/smithy-cli.html) instalado.

1. **Ingresa al subdirectorio base de Smithy:**
   ```bash
   cd airbnb-smithy
   ```

2. **Construye el modelo validando la estructura:**
   ```bash
   smithy build
   ```
   Si la sintaxis del modelo es exitosa y carece de inconsistencias, las proyecciones se generarán en la carpeta `build/`.

## 🔒 Arquitectura de Seguridad (Resumen)

Nuestra arquitectura ha extraído deliberadamente el estado y el secreto para blindar aplicaciones micro-transaccionales:
- Protocolo Front-Edge: **OpenID Connect (OIDC)** con **Authorization Code Flow + PKCE** a un Identity Provider de grado empresarial (Auth0).
- Todos los core-systems asumen identidades extraídas de **JSON Web Tokens (JWT)**. No se permite mandar explícitamente el perfil del cliente dentro del Payload, evitando ataques IDOR y escalamiento de privilegios.
