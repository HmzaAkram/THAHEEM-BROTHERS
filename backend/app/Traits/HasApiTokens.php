<?php

namespace App\Traits;

trait HasApiTokens
{
    public function createToken(string $name, array $abilities = ['*'])
    {
        $type = (new \ReflectionClass($this))->getShortName(); // User or Company
        $id = $this->id;
        $mockToken = strtolower($type) . "_" . $id . "_mock_token";

        return new class($mockToken) {
            public $plainTextToken;
            public function __construct($token) { $this->plainTextToken = $token; }
            public function __get($key) {
                if ($key === 'plainTextToken') return $this->plainTextToken;
                return null;
            }
        };
    }


    public function tokens()
    {
        return null;
    }

    public function currentAccessToken()
    {
        return new class {
            public function delete() { return true; }
        };
    }
}
