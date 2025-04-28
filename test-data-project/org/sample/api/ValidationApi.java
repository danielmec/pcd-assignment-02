package org.sample.api;
import java.util.regex.Pattern;

public class ValidationApi {
    private static Pattern emailPattern = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    
    public static boolean validate(Object obj) {
        return obj != null;
    }
}