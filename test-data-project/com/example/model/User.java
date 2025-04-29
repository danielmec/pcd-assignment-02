package com.example.model;
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
}