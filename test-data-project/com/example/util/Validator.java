package com.example.util;
import com.example.model.User;
import org.sample.api.ValidationApi;

public class Validator {
    public static boolean isValid(Object obj) {
        if (obj instanceof User) {
            return ValidationApi.validate(obj);
        }
        return false;
    }
}