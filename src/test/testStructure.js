const fs = require('fs').promises;
const path = require('path');

/**
 * Crea una struttura di test con package e classi
 */
async function createTestStructure() {
  const testRoot = path.resolve(__dirname, '../../test-data-project');
  
  // Struttura cartelle
  const dirs = [
    '',
    '/com/example/model',
    '/com/example/service',
    '/com/example/util',
    '/org/sample/api'
  ];
  
  // Crea le directories
  for (const dir of dirs) {
    const fullPath = path.join(testRoot, dir);
    await fs.mkdir(fullPath, { recursive: true }).catch(() => {});
  }

  // Crea i file
  const files = [
    {
      path: '/com/example/model/User.java',
      content: `package com.example.model;
import java.util.Date;
import java.util.UUID;

public class User {
    private UUID id;
    private String name;
    private Date birthDate;
}`
    },
    {
      path: '/com/example/service/UserService.java',
      content: `package com.example.service;
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
}`
    },
    {
      path: '/com/example/util/Validator.java',
      content: `package com.example.util;
import com.example.model.User;
import org.sample.api.ValidationApi;

public class Validator {
    public static boolean isValid(Object obj) {
        if (obj instanceof User) {
            return ValidationApi.validate(obj);
        }
        return false;
    }
}`
    },
    {
      path: '/org/sample/api/ValidationApi.java',
      content: `package org.sample.api;
import java.util.regex.Pattern;

public class ValidationApi {
    private static Pattern emailPattern = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    public static boolean validate(Object obj) {
        return obj != null;
    }
}`
    }
  ];

  for (const file of files) {
    await fs.writeFile(path.join(testRoot, file.path), file.content);
  }
  
  console.log('Struttura di test creata con successo in:', testRoot);
  return testRoot;
}

module.exports = { createTestStructure };