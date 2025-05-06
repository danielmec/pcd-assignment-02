package com.example.model;
import java.math.BigDecimal;

public interface Employee extends Person {
    BigDecimal getSalary();
    void setSalary(BigDecimal salary);
}