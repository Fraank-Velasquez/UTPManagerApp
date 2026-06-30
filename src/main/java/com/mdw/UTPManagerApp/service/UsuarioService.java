package com.mdw.UTPManagerApp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mdw.UTPManagerApp.model.Rol;
import com.mdw.UTPManagerApp.model.Usuario;
import com.mdw.UTPManagerApp.repository.RolRepository;
import com.mdw.UTPManagerApp.repository.UsuarioRepository;

@Service
public class UsuarioService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private RolRepository rolRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return usuarioRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    public boolean registrar(String username, String rawPassword, String nombreRol) {

        if (usuarioRepo.existsByUsername(username)) {
            return false;
        }

        Rol rol = rolRepo.findByNombre(nombreRol)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + nombreRol));

        String passwordCifrada = passwordEncoder.encode(rawPassword);

        Usuario nuevoUsuario = new Usuario(username, passwordCifrada, rol);
        usuarioRepo.save(nuevoUsuario);
        return true;
    }
}
