package com.mdw.UTPManagerApp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@DisplayName("Pruebas de Seguridad: SecurityConfig")
class SecurityConfigTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())  
                .build();
    }

    @Test
    @DisplayName("1) La página de login es pública y devuelve 200 OK")
    void paginaLoginDebeSerAccesibleSinAutenticacion() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("2) La página de registro es pública y devuelve 200 OK")
    void paginaRegistroDebeSerAccesibleSinAutenticacion() throws Exception {
        mockMvc.perform(get("/registro"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("3) El inicio requiere autenticación: redirige al login sin sesión")
    void paginaInicioDebeRequerirAutenticacion() throws Exception {
        mockMvc.perform(get("/inicio"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    @DisplayName("4) Las tareas requieren autenticación: redirigen al login sin sesión")
    void paginaTareasDebeRequerirAutenticacion() throws Exception {
        mockMvc.perform(get("/tareas"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    @DisplayName("5) Los proyectos requieren autenticación: redirigen al login sin sesión")
    void paginaProyectosDebeRequerirAutenticacion() throws Exception {
        mockMvc.perform(get("/proyectos"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    @DisplayName("6) Un usuario con ROLE_USER puede acceder al inicio")
    @WithMockUser(username = "maria.lopez", roles = {"USER"})
    void usuarioConRoleUserPuedeAccederAlInicio() throws Exception {
        mockMvc.perform(get("/inicio"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("7) Un usuario con ROLE_USER puede acceder a tareas")
    @WithMockUser(username = "maria.lopez", roles = {"USER"})
    void usuarioConRoleUserPuedeAccederATareas() throws Exception {
        mockMvc.perform(get("/tareas"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("8) Un usuario con ROLE_ADMIN puede acceder al inicio")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void usuarioAdminPuedeAccederAlInicio() throws Exception {
        mockMvc.perform(get("/inicio"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("9) Un usuario con ROLE_ADMIN puede acceder a proyectos")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void usuarioAdminPuedeAccederAProyectos() throws Exception {
        mockMvc.perform(get("/proyectos"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("10) La API de proyectos requiere autenticación sin sesión")
    void apiProyectosDebeRequerirAutenticacion() throws Exception {
        mockMvc.perform(get("/api/proyectos"))
                .andExpect(status().is3xxRedirection());
    }

}
