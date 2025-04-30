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
      path: '/com/example/model/Person.java',
      content: `package com.example.model;

public interface Person {
    String getName();
    void setName(String name);
}`
    },
    {
      path: '/com/example/model/BaseEntity.java',
      content: `package com.example.model;
import java.io.Serializable;

public abstract class BaseEntity implements Serializable {
    private Long id;
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
}`
    },
    {
      path: '/com/example/model/Employee.java',
      content: `package com.example.model;
import java.math.BigDecimal;

public interface Employee extends Person {
    BigDecimal getSalary();
    void setSalary(BigDecimal salary);
}`
    },
    {
      path: '/com/example/model/User.java',
      content: `package com.example.model;
import java.util.Date;
import java.util.UUID;

public class User extends BaseEntity implements Person {
    private UUID uuid;
    private String name;
    private Date birthDate;
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Date getBirthDate() {
        return birthDate;
    }
    
    public void setBirthDate(Date birthDate) {
        this.birthDate = birthDate;
    }
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
import org.sample.api.*;

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