import Image from "next/image";
import {
  ExternalLink,
  Github,
  Globe,
  Server,
  Database,
  Cloud,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">
                Plant Monitoring System
              </h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8">
                An over engineered dashboard for monitoring soil moisture,
                light, temperature, and humidity across multiple plants with
                data visualization and Arduino integration.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="lg" asChild>
                  <a
                    href="https://github.com/Winston-Saarloos/Nudrasil"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    View on GitHub
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src="/images/plants-720.webp"
                  alt="Plant Monitoring Dashboard Screenshot"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Tech Stack */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">The Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-primary">Frontend</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Next.js</Badge>
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Drizzle ORM</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-primary">
                  Backend & Database
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Next.js API Routes</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-primary">
                  Infrastructure
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Docker</Badge>
                  <Badge variant="secondary">Harbor Registry</Badge>
                  <Badge variant="secondary">GitHub Actions</Badge>
                  <Badge variant="secondary">Cloudflare Tunnel</Badge>
                  <Badge variant="secondary">Ubuntu Server</Badge>
                  <Badge variant="secondary">nginx</Badge>
                  <Badge variant="secondary">Portainer</Badge>
                  <Badge variant="secondary">Pi-hole</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-primary">
                  Development Tools
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">VS Code</Badge>
                  <Badge variant="secondary">Platform.io</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Architecture */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">System Architecture</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Ubuntu Machine</h4>
                    <p className="text-sm text-muted-foreground">
                      Host server for Docker containers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">CI/CD Pipeline</h4>
                    <p className="text-sm text-muted-foreground">
                      Self-hosted GitHub Runner + Actions for automated building
                      & deployment
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Container Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Harbor private registry with Portainer monitoring
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Secure Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Cloudflare Tunnel for access without port forwarding
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="mb-16">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Hardware Components
                  </CardTitle>
                  <CardDescription>
                    Arduino-based sensors for comprehensive plant monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-primary">
                          Main Board
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          ESP8266 NodeMCU CP2102 (Wi-Fi enabled microcontroller)
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-primary">
                          Light Sensor
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          TSL2561 Luminosity Sensor for ambient light
                          measurement
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-primary">
                          ADC Converter
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          ADS1115 for high-precision analog-to-digital
                          conversion
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-primary">
                          Climate Sensor
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          DHT22/AM2302 for temperature & humidity monitoring
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-primary">
                          Soil Sensors
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Gikfun Capacitive Soil Moisture Sensors x3
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hardware Image */}
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src="/images/plants-1080-labeled.webp"
                  alt="Hardware Setup - ESP8266 with Sensors"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src="/images/circuits-720.webp"
                  alt="Sensors Deployed in Plants"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Flow */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Deployment Pipeline</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Github className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Code Push</h3>
              <p className="text-sm text-muted-foreground">
                Self-hosted GitHub Runner builds Docker images on merge to main
                branch
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Database className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Registry Push</h3>
              <p className="text-sm text-muted-foreground">
                Built images pushed to Harbor private container registry
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Server className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Auto Deploy</h3>
              <p className="text-sm text-muted-foreground">
                Latest container automatically deployed to Ubuntu server
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Explore the Project</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <a
                href="https://app.nudrasil.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Dashboard
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://github.com/Winston-Saarloos/Nudrasil"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View Source Code
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
