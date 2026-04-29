package com.game.maze.model;

public class Score {
    private Long id;
    private String name;
    private int score;
    private int level;
    private int time;

    public Score() {}

    public Score(Long id, String name, int score, int level, int time) {
        this.id = id;
        this.name = name;
        this.score = score;
        this.level = level;
        this.time = time;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    
    public int getTime() { return time; }
    public void setTime(int time) { this.time = time; }
}
