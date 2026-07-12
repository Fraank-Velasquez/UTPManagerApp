package com.mdw.UTPManagerApp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@ControllerAdvice
public class CustomErrorController {

    // Captura páginas no encontradas
    @ExceptionHandler({ NoHandlerFoundException.class, NoResourceFoundException.class })
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String error404() {
        return "error/404";
    }

    // Captura cualquier caída interna del sistema
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String error500(Exception ex, Model model) {
        model.addAttribute("errorMessage", ex.getMessage());
        return "error/500";
    }
}
