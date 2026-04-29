package com.game.maze.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import com.game.maze.model.Score;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
public class ScoreService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void saveScore(Score score) {
        String sql = "INSERT INTO scores (name, score, level, time) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, score.getName(), score.getScore(), score.getLevel(), score.getTime());
    }

    public List<Score> getLeaderboard() {
        String sql = "SELECT * FROM scores ORDER BY score DESC, time ASC LIMIT 10";
        return jdbcTemplate.query(sql, new RowMapper<Score>() {
            @Override
            public Score mapRow(ResultSet rs, int rowNum) throws SQLException {
                return new Score(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getInt("score"),
                    rs.getInt("level"),
                    rs.getInt("time")
                );
            }
        });
    }
}
