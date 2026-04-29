package com.game.maze.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.game.maze.model.User;

@Service
public class UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public boolean registerOrLogin(User user) {
        String checkSql = "SELECT count(*) FROM users WHERE username = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, user.getUsername());

        if (count == 0) {
            // Register new user
            String insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";
            jdbcTemplate.update(insertSql, user.getUsername(), user.getPassword());
            return true;
        } else {
            // Simple login check
            String loginSql = "SELECT count(*) FROM users WHERE username = ? AND password = ?";
            Integer match = jdbcTemplate.queryForObject(loginSql, Integer.class, user.getUsername(), user.getPassword());
            return match > 0;
        }
    }
}
