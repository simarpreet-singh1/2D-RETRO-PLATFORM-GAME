package com.game.maze.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.game.maze.model.Score;
import com.game.maze.service.ScoreService;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @PostMapping("/saveScore")
    public ResponseEntity<String> saveScore(@RequestBody Score score) {
        try {
            scoreService.saveScore(score);
            return ResponseEntity.ok("Score saved successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error saving score");
        }
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Score>> getLeaderboard() {
        return ResponseEntity.ok(scoreService.getLeaderboard());
    }
}
