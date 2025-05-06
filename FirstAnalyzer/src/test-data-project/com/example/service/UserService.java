package com.example.service;
import com.example.model.User;
import com.example.util.Validator;
import java.util.List;
import java.util.ArrayList;

public class UserService {
    private List<User> users = new ArrayList<>();
    
    public boolean addUser(User user) {
        if (Validator.isValid(user)) {
            return users.add(user);
        }
        return false;
    }
}