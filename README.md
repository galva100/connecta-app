# Connecta

Aplicación móvil de citas para Android, construida con Expo, React Native y TypeScript.

## Incluye en esta primera versión

- Inicio de sesión y registro por correo (Supabase, con modo demostración sin claves).
- Navegación principal: Descubrir, Conexiones y Perfil.
- Tarjetas de perfiles y acciones de interés/descartar.
- Esquema SQL inicial para perfiles y "me gusta" con políticas de acceso.

## Ejecutar

1. Copia `.env.example` como `.env` y agrega las claves de Supabase cuando tengas el proyecto creado.
2. Instala dependencias: `npm install`.
3. Inicia la aplicación: `npm run android`.

El archivo `supabase/schema.sql` prepara las tablas y reglas de seguridad del backend inicial.
