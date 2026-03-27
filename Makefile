VERSION ?= $(shell cat VERSION)

.PHONY: install dev dev-web dev-backend build lint typecheck test test-web test-backend docker-up docker-down

install:
	npm install

dev:
	npm run dev:full

dev-web:
	npm run dev:web

dev-backend:
	npm run dev:backend

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

test-web:
	npm run test:web

test-backend:
	npm run test:backend

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
