# Diario de Cambios Técnico — Integración de Spring Security 6

Este documento constituye una bitácora técnica detallada, diseñada para registrar todas las decisiones de diseño, arquitectura y codificación tomadas durante la integración del módulo de seguridad en la aplicación `UTPManagerAPP_Final3`. Su objetivo es servir como soporte conceptual y argumentativo para la sustentación del proyecto, detallando el "qué", el "cómo" y, fundamentalmente, el "por qué" de cada línea de código.

---

## 1. Habilitación de Módulos (Dependencias en pom.xml)

**Archivo(s) afectado(s):** `pom.xml`
**Tipo de cambio:** MODIFICADO

### ¿Qué se hizo?
Se incorporaron dos dependencias fundamentales al gestor de paquetes de Maven:

```xml
<!-- Núcleo de Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Puente de integración entre Thymeleaf (Vistas) y Spring Security -->
<dependency>
    <groupId>org.thymeleaf.extras</groupId>
    <artifactId>thymeleaf-extras-springsecurity6</artifactId>
</dependency>
```

### ¿Por qué se hizo así?
El framework Spring Boot opera bajo el paradigma de **Convención sobre Configuración** y **Auto-Configuración**. Al declarar `spring-boot-starter-security`, el framework detecta la dependencia en el *classpath* y automáticamente levanta un muro de seguridad alrededor de todos los endpoints, aplicando la clase `DefaultSecurityFilterChain`. Por su parte, la dependencia de `thymeleaf-extras` es estrictamente necesaria para la capa de presentación (frontend renderizado en el servidor); sin ella, el motor de plantillas Thymeleaf sería "ciego" ante el contexto de seguridad y no podría leer qué usuario está conectado ni qué roles posee.

### Concepto académico clave
**Arquitectura Modular y Auto-Configuración:** Demuestra cómo Spring Boot desacopla las funcionalidades. La seguridad no está intrínsecamente ligada al núcleo web, sino que se inyecta como una capa transversal (cross-cutting concern).

### ¿Qué pasaría si no estuviera?
No existiría interceptación de peticiones. Las contraseñas viajarían y se validarían en texto plano (una vulnerabilidad crítica), y tendríamos que programar filtros personalizados desde cero para manejar sesiones HTTP y cookies, reinventando la rueda y abriendo la puerta a brechas de seguridad (como ataques Session Fixation).

---

## 2. Modelado de Dominio Seguro (Entidades Rol y Usuario)

**Archivo(s) afectado(s):** `model/Rol.java`, `model/Usuario.java`
**Tipo de cambio:** NUEVO

### ¿Qué se hizo?
Se crearon las clases que representan la tabla `usuario` y `rol` en la base de datos mediante ORM (Hibernate). Para lograr una integración perfecta con la seguridad, la entidad `Usuario` implementa la interfaz nativa `UserDetails` de Spring.

```java
@Entity
public class Usuario implements UserDetails {
    // Definición de columnas...
    
    // Spring Security requiere este método para evaluar permisos
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Envolvemos nuestro 'Rol' en el formato que Spring entiende
        return List.of(new SimpleGrantedAuthority(rol.getNombre()));
    }
    
    // Métodos obligatorios de la interfaz (cuentas no expiradas, etc.)
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
```

### ¿Por qué se hizo así?
Existen dos formas de conectar una base de datos con Spring Security: crear un "Adaptador" externo o hacer que tu propia Entidad hable el idioma de Spring. Optamos por lo segundo (implementar `UserDetails`). Esto evita sobrecargar la memoria creando múltiples objetos que representan a la misma persona. Además, hemos escrito los Getters y Setters explícitamente a mano, prescindiendo deliberadamente de la librería *Lombok*, para evidenciar el control manual sobre la encapsulación de datos y evitar la generación de código "oculto" que suele ser mal visto en evaluaciones estrictas de arquitectura de software.

### Concepto académico clave
**Polimorfismo e Interfaces:** Al implementar `UserDetails`, nuestro humilde objeto `Usuario` se convierte, a los ojos del framework de seguridad, en un "Principal" válido que puede ser inyectado y consultado en toda la aplicación.

### ¿Qué pasaría si no estuviera?
El motor de validación de credenciales fallaría, ya que espera recibir un objeto tipo `UserDetails` al buscar en la base de datos. Si le devolviéramos una clase cualquiera, lanzaría una excepción de casting (ClassCastException) y nadie podría iniciar sesión.

---

## 3. Capa de Acceso a Datos (Patrón Repository)

**Archivo(s) afectado(s):** `repository/RolRepository.java`, `repository/UsuarioRepository.java`
**Tipo de cambio:** NUEVO

### ¿Qué se hizo?
Se implementó el patrón Repository extendiendo `JpaRepository`. Se agregaron dos métodos clave:

```java
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Para buscar al usuario durante el Login
    Optional<Usuario> findByUsername(String username);
    
    // Para validaciones preventivas antes de registrar
    boolean existsByUsername(String username);
}
```

### ¿Por qué se hizo así?
La interfaz `JpaRepository` abstrae la complejidad de JDBC y las sentencias SQL. El método `findByUsername` es el pilar de la autenticación: devuelve un `Optional` que previene el infame `NullPointerException`. 
Por otro lado, `existsByUsername` es una decisión de diseño de alto nivel: en lugar de intentar insertar el usuario y atrapar una excepción `DataIntegrityViolationException` (lo cual es costoso a nivel de CPU y ensucia los logs), ejecutamos una consulta ligera (`SELECT COUNT`) previa. Esto cumple estrictamente con el requisito de evitar excepciones no controladas provenientes de la base de datos.

### Concepto académico clave
**Query Derivation (Consultas Derivadas):** Spring Data JPA implementa el patrón *Builder* dinámico, transformando el nombre del método Java en una consulta SQL nativa optimizada en tiempo de ejecución, separando la lógica de negocio del lenguaje de base de datos.

---

## 4. Orquestación y Filtros de Seguridad (SecurityConfig y PasswordConfig)

**Archivo(s) afectado(s):** `config/SecurityConfig.java`, `config/PasswordConfig.java`
**Tipo de cambio:** NUEVO

### ¿Qué se hizo?
Se configuraron las reglas de tráfico de red y el motor de cifrado. Se dividió la configuración en dos archivos para evitar una "Dependencia Circular" en el contenedor de Beans de Spring (IoC).

```java
// En PasswordConfig.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(); // Hashing seguro
}

// En SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // Deshabilitamos protección CSRF solo para las rutas de la API (JSON)
        .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**")) 
        
        // Reglas de acceso
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/css/**", "/js/**", "/login").permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN") // Solo administradores
            .anyRequest().authenticated()
        )
        // Flujo de Login y Errores
        .formLogin(form -> form.loginPage("/login").defaultSuccessUrl("/", true))
        .exceptionHandling(ex -> ex.accessDeniedPage("/error/403-redirect"));
    
    return http.build();
}
```

### ¿Por qué se hizo así?
1. **PasswordConfig:** Previene el ciclo de dependencia (`SecurityConfig` -> `UsuarioService` -> `SecurityConfig`).
2. **SecurityFilterChain:** Se emplea DSL (Domain Specific Language) con expresiones Lambda, que es el estándar moderno.
3. **CSRF Ignorado en /api/**:** Las llamadas AJAX/Fetch que realiza el Javascript del frontend para borrar/crear tareas suelen ser bloqueadas si no incluyen un token. Deshabilitar CSRF exclusivamente en la API (y mantenerlo en el resto de la web) es una decisión pragmática para garantizar que la UX interactiva no se rompa, manteniendo segura la sesión.

### Concepto académico clave
**Filtros HTTP (Filter Chain) y Criptografía Unidireccional:** Se demuestra el entendimiento del patrón "Chain of Responsibility" (Cadena de responsabilidad) para interceptar peticiones, y el uso de funciones Hash criptográficas (BCrypt) que incorporan "Salting" para prevenir ataques de diccionario (Rainbow Tables).

---

## 5. El Cerebro de la Autenticación (UsuarioService)

**Archivo(s) afectado(s):** `service/UsuarioService.java`
**Tipo de cambio:** NUEVO

### ¿Qué se hizo?
Se creó la lógica de negocio que une a Spring Security con nuestra base de datos.

```java
@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    // ...

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado en la DB"));
    }
}
```

### ¿Por qué se hizo así?
Spring Security contiene toda la lógica para comparar contraseñas, encriptar y generar sesiones. Sin embargo, no sabe **dónde** guardas a tus usuarios (¿En un archivo de texto? ¿En MongoDB? ¿En MySQL?). Para solucionar esto, usa la interfaz `UserDetailsService`. Nosotros proveemos la implementación concreta (`UsuarioService`). Spring nos llama a nosotros pasándonos el username; nosotros buscamos en MySQL y le devolvemos el objeto ensamblado, y él se encarga del resto.

### Concepto académico clave
**Patrón Estrategia (Strategy Pattern) e Inversión de Control (IoC):** El framework dicta el flujo principal (el login), pero delega detalles específicos (de dónde salen los datos) a un componente inyectado por nosotros en tiempo de ejecución.

---

## 6. Adaptación Arquitectónica de Controladores (homeController)

**Archivo(s) afectado(s):** `controller/homeController.java`
**Tipo de cambio:** MODIFICADO

### ¿Qué se hizo?
Se eliminó la lógica que validaba contraseñas manualmente (los viejos condicionales `if(username.equals("admin"))`). Ahora el controlador es puramente de redirección.

```java
@GetMapping("/login")
public String login() {
    return "Modulos/login"; // Spring Security se encarga de recibir el POST
}
```

### ¿Por qué se hizo así?
El patrón MVC exige una separación estricta de responsabilidades (Separation of Concerns). Un controlador no debe hacer el trabajo de un filtro de seguridad. Al delegar la validación al `UsernamePasswordAuthenticationFilter` de Spring, limpiamos el código del controlador, reduciendo la deuda técnica y los posibles "bugs" de seguridad (como olvidar destruir la sesión al salir).

---

## 7. Programación Orientada a Aspectos: Manejo de Errores Globales

**Archivo(s) afectado(s):** `controller/CustomErrorController.java`, plantillas de errores (403, 404, 500)
**Tipo de cambio:** NUEVO

### ¿Qué se hizo?
Se interceptaron todas las excepciones que la aplicación pudiera arrojar antes de que lleguen al usuario final.

```java
@ControllerAdvice
public class CustomErrorController {

    // Captura páginas no encontradas
    @ExceptionHandler(NoHandlerFoundException.class)
    public String handleNotFoundError() {
        return "error/404";
    }

    // Captura cualquier caída interna del sistema
    @ExceptionHandler(Exception.class)
    public String handleInternalError(Exception e) {
        return "error/500"; 
    }
}
```

### ¿Por qué se hizo así?
Este era un **requisito innegociable de la rúbrica**: "No debe verse la pantalla blanca por defecto de Spring". Mostrar un rastro de pila (Stack Trace) de Java en producción expone detalles de la infraestructura a posibles atacantes y genera desconfianza en el usuario. 

### Concepto académico clave
**Programación Orientada a Aspectos (AOP):** `@ControllerAdvice` funciona como un Aspecto que "envuelve" a todos los controladores del sistema. En lugar de poner un bloque `try-catch` en cada método de cada controlador, definimos el manejo de errores globalmente en un solo archivo.

---

## 8. Seguridad Transparente en la Vista (login.html)

**Archivo(s) afectado(s):** `templates/Modulos/login.html`
**Tipo de cambio:** MODIFICADO

### ¿Qué se hizo?
Se estandarizó el formulario de HTML5 para cumplir con el protocolo de Spring Security.

```html
<!-- El uso de th:action inyecta magia oscura de seguridad (CSRF) -->
<form th:action="@{/login}" method="post">
    <!-- Los nombres exactos requeridos por el framework -->
    <input type="text" name="username" required>
    <input type="password" name="password" required>
    
    <button type="submit" class="btn btn-primary w-100">Iniciar Sesión</button>
</form>

<!-- Manejo dinámico de mensajes desde el servidor -->
<div th:if="${param.error}" class="alert alert-danger">Credenciales inválidas</div>
```

### ¿Por qué se hizo así?
Al prescindir del viejo método `onclick` de Javascript para procesar el login, delegamos el proceso al motor del navegador, que es mucho más seguro para enviar contraseñas (evitando ataques de Cross-Site Scripting - XSS). Thymeleaf, al detectar el atributo `th:action`, inserta automáticamente un `<input type="hidden">` con un token CSRF criptográfico. Si este token no viaja junto con la contraseña, el servidor rechazará la petición con un error 403 Forbidden para prevenir ataques de falsificación de peticiones.

---

## 9. Renderizado Condicional del Perfil de Usuario (layout.html)

**Archivo(s) afectado(s):** `templates/fragments/layout.html`
**Tipo de cambio:** MODIFICADO

### ¿Qué se hizo?
Se extrajeron los datos directamente del contexto de seguridad para mostrarlos en la barra de navegación superior.

```html
<!-- Extrae el nombre de usuario y el rol del objeto Principal de Spring -->
<span class="d-none d-md-block ms-2" sec:authentication="name"></span>
<span class="text-muted small" sec:authentication="principal.rol.nombre"></span>

<!-- Logout protegido por token CSRF usando un Formulario POST en vez de un simple <a> -->
<form th:action="@{/logout}" method="post" class="m-0 p-0">
    <button type="submit" class="dropdown-item text-danger">
        <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
    </button>
</form>
```

### ¿Por qué se hizo así?
En aplicaciones web clásicas, tendríamos que pasar el objeto `Usuario` manualmente a través del objeto `Model` en cada uno de los métodos de nuestros controladores. Thymeleaf Extras soluciona este anti-patrón permitiendo que la vista lea directamente la información desde la sesión almacenada en el hilo (ThreadLocal) del servidor.
El logout por POST es una medida estándar de la industria; realizar logouts a través de peticiones GET (`<a href>`) es vulnerable a que scripts de terceros deslogueen al usuario maliciosamente cargando una imagen engañosa.

---

## 10. Control de Acceso Basado en Roles en la Interfaz (RBAC)

**Archivo(s) afectado(s):** `proyectos.html`, `tareas.html`, etc.
**Tipo de cambio:** MODIFICADO

### ¿Qué se hizo?
Se aplicaron directivas de seguridad a nivel de Nodo del DOM en el HTML para ocultar funcionalidades críticas a usuarios regulares.

```html
<!-- Este botón simplemente no existirá en el HTML si el usuario no es ADMIN -->
<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#crearProyectoModal" 
        sec:authorize="hasRole('ADMIN')">
    <i class="bi bi-plus-lg"></i> Nuevo Proyecto
</button>

<!-- Botón de eliminar con icono de basurero protegido -->
<button class="btn btn-sm btn-outline-danger" sec:authorize="hasRole('ADMIN')">
    <i class="bi bi-trash3"></i>
</button>
```

### ¿Por qué se hizo así?
Esta técnica responde de manera directa al requerimiento: *"botones de registro, cuando la prioridad que corresponde está para eso"*. Mostrar botones de eliminación a un usuario que no tiene permisos resulta en una experiencia de usuario (UX) frustrante, ya que generaría un error de acceso denegado (403) al hacer clic. 

### Concepto académico clave
**Defensa en Profundidad y Renderizado Lógico:** Se comprueba el principio de "Seguridad por diseño". Thymeleaf ejecuta una expresión SpEL (Spring Expression Language) evaluando `hasRole('ADMIN')`. Si la expresión es falsa, el servidor omitirá renderizar todo ese bloque HTML, asegurándose de que el cliente (el navegador) jamás reciba siquiera el código fuente de dicho botón.

---

## 11. Aislamiento de Datos por Usuario y Registro

**Archivo(s) afectado(s):** `controller/homeController.java`, `model/Proyecto.java`, `model/Actividad.java`, `repository/*`, `service/*`, `config/DataInitializer.java`, `login.html`
**Tipo de cambio:** MODIFICADO / NUEVO

### ¿Qué se hizo?
Se habilitó el registro de nuevos usuarios y se implementó un modelo de aislamiento (Multi-Tenancy lógico) para que cada usuario interactúe exclusivamente con su propia información.
1. **Registro:** Se conectó la tarjeta de registro (`carta-back`) en `login.html` hacia una nueva ruta `POST /registro` en el `homeController`. Esta ruta invoca a `usuarioService.registrar(...)` y redirige enviando atributos Flash (`RedirectAttributes`) para mostrar alertas de éxito o error.
2. **Propiedad de los Datos:** Se añadieron relaciones `@ManyToOne` (campo `propietario`) tanto en `Proyecto` como en `Actividad` vinculándolas con la entidad `Usuario`. 
3. **Repositorios y Servicios:** Se añadieron métodos en `IproyectoRepository` e `IActidadRepository` (e.g. `findByPropietarioUsername`) para que todas las consultas SQL filtren implícitamente por el dueño de la información.
4. **Controladores Seguros:** Ahora, cada método en `homeController`, `proyectoController` y `actividadController` intercepta el objeto `Principal` inyectado por Spring Security. El nombre del usuario autenticado se utiliza para consultar la base de datos (Ej: `proyectoService.obtenerPorPropietario(principal.getName())`).
5. **DataInitializer:** Se adaptó el inicializador para que todos los proyectos de demostración se asignen al usuario `admin`.

### ¿Por qué se hizo así?
Un sistema de gestión personal carece de sentido si todos ven las tareas de todos. Modificar la base de datos para establecer relaciones de propiedad es el núcleo de las aplicaciones SaaS modernas. Además, al integrar la inyección de `Principal` en los controladores, garantizamos que un usuario malintencionado no pueda ver el proyecto de otra persona forzando un ID en la URL (como `GET /proyectos/5`), ya que el controlador verifica la propiedad antes de renderizar la vista. Por último, según lo acordado, retiramos la restricción de crear/eliminar proyectos (antes exclusiva para admin) para que los usuarios normales puedan gestionar sus propias tareas plenamente.

### Concepto académico clave
**Seguridad a Nivel de Datos (Data-Level Security) y Multi-tenancy Lógico:** No basta con proteger el acceso a las URLs (Control de Acceso); también se debe garantizar que los datos devueltos pertenezcan a la sesión activa (Autorización de Recursos). Esto se logró extendiendo el modelo ORM (Object-Relational Mapping) e inyectando dinámicamente la identidad (`Principal`) en la capa de servicios.
