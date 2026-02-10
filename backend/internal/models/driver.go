package models

import (
	"context"
	"garbage_trucks/backend/internal/database"
	"time"
)

type Driver struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

func GetAllDrivers(ctx context.Context) ([]Driver, error) {
	rows, err := database.Pool.Query(ctx, `
		SELECT id, name, created_at 
		FROM drivers 
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var drivers []Driver
	for rows.Next() {
		var d Driver
		if err := rows.Scan(&d.ID, &d.Name, &d.CreatedAt); err != nil {
			return nil, err
		}
		drivers = append(drivers, d)
	}

	return drivers, rows.Err()
}

func GetDriverByID(ctx context.Context, id int) (*Driver, error) {
	var driver Driver
	err := database.Pool.QueryRow(ctx, `
		SELECT id, name, created_at 
		FROM drivers 
		WHERE id = $1
	`, id).Scan(&driver.ID, &driver.Name, &driver.CreatedAt)
	
	if err != nil {
		return nil, err
	}
	
	return &driver, nil
}

func CreateDriver(ctx context.Context, name string) (*Driver, error) {
	var driver Driver
	err := database.Pool.QueryRow(ctx, `
		INSERT INTO drivers (name) 
		VALUES ($1) 
		RETURNING id, name, created_at
	`, name).Scan(&driver.ID, &driver.Name, &driver.CreatedAt)
	
	if err != nil {
		return nil, err
	}
	
	return &driver, nil
}

func DeleteDriver(ctx context.Context, id int) error {
	_, err := database.Pool.Exec(ctx, `DELETE FROM drivers WHERE id = $1`, id)
	return err
}

func UpdateDriver(ctx context.Context, id int, name string) (*Driver, error) {
	var driver Driver
	err := database.Pool.QueryRow(ctx, `
		UPDATE drivers 
		SET name = $1
		WHERE id = $2
		RETURNING id, name, created_at
	`, name, id).Scan(&driver.ID, &driver.Name, &driver.CreatedAt)
	
	if err != nil {
		return nil, err
	}
	
	return &driver, nil
}
